# AWS Deployment Guide - Loan Management System

Follow these step-by-step instructions to deploy your Loan Management System on AWS.

---

## Phase 1: Set Up AWS S3 for PDF Slip Uploads (Blob Storage)

To make S3 uploads work, you need to create an S3 bucket and an IAM user with permission to write to that bucket.

### 1. Create an S3 Bucket
1. Log in to the **AWS Management Console**.
2. Search for and open **S3**.
3. Click **Create bucket**.
4. Configure:
   - **Bucket name**: e.g., `creditsea-documents` (must be globally unique).
   - **AWS Region**: Choose one close to your target users (e.g., `ap-south-1` Mumbai).
   - **Object Ownership**: Check **ACLs enabled** (select **Bucket owner preferred**).
   - **Block Public Access settings**: Uncheck **Block all public access** (since sanction executives need to click and read/download the uploaded PDF files from their browsers).
5. Click **Create bucket**.

### 2. Configure CORS on S3 Bucket
To allow your frontend (which will be hosted on a different URL) to access S3 directly:
1. Click on your newly created bucket.
2. Go to the **Permissions** tab.
3. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
4. Paste the following JSON:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
5. Click **Save changes**.

### 3. Create an IAM User and Get API Keys
1. Open the **IAM** service in AWS Console.
2. Go to **Users** in the sidebar and click **Create user**.
3. Enter a username (e.g., `creditsea-s3-uploader`) and click **Next**.
4. Select **Attach policies directly**.
5. Search for `AmazonS3FullAccess`, check it, and click **Next**.
6. Click **Create user**.
7. Click on your newly created user, go to the **Security credentials** tab, and scroll down to **Access keys**.
8. Click **Create access key** (select **Local code** or **Other** as the use case).
9. Copy your **Access Key ID** and **Secret Access Key**. 
   > [!CAUTION]
   > Save the Secret Key immediately. You will not be able to view it again once you leave this page.

---

## Phase 2: Set Up MongoDB Atlas (Cloud Database)

Instead of running MongoDB on your AWS server, using **MongoDB Atlas** is the standard, zero-maintenance approach for production.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Create a free shared cluster (e.g., in AWS region closest to your app).
3. Under **Network Access**, add IP address `0.0.0.0/0` (allows your AWS Express server to connect).
4. Under **Database Access**, create a database user with a password.
5. Click **Connect** -> **Drivers** and copy the connection string. It will look like:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/creditsea?retryWrites=true&w=majority`

---

## Phase 3: Deploy the Express Backend on AWS EC2

We will run the Express backend on an **AWS EC2** instance (Ubuntu Linux) running **PM2** (Process Manager) and **Nginx** (Reverse Proxy).

### 1. Launch an EC2 Instance
1. Go to the **EC2** dashboard in AWS.
2. Click **Launch instance**.
3. Name it `creditsea-backend`.
4. Choose **Ubuntu Server 22.04 LTS** (eligible for Free Tier).
5. Instance Type: `t2.micro` (or `t3.micro`).
6. Create or select a **Key Pair (.pem)** so you can SSH into the server from your computer.
7. Under **Network settings**, check:
   - Allow SSH traffic from anywhere (or your IP).
   - Allow HTTP traffic from the internet.
   - Allow HTTPS traffic from the internet.
8. Click **Launch instance**.

### 2. Configure EC2 Security Group
To allow the frontend to call your Express server on port `5000`:
1. Go to your instance details, click the **Security** tab, and click on your **Security Group**.
2. Click **Edit inbound rules**.
3. Click **Add rule**:
   - **Type**: Custom TCP
   - **Port Range**: `5000`
   - **Source**: Anywhere-IPv4 (`0.0.0.0/0`)
4. Click **Save rules**.

### 3. Connect and Setup the Node Environment
Open your terminal (e.g. Git Bash, CMD, or Terminal) and SSH into the instance using your Key Pair:
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

Once connected, install Node.js, Git, and PM2:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify install
node -v
npm -v

# Install PM2 (keeps Node server running in the background)
sudo npm install -g pm2
```

### 4. Clone and Configure the Project
1. Clone your repository:
   ```bash
   git clone https://github.com/adityakumarprasad/CreditSea.git
   cd CreditSea/backend
   ```
2. Create and fill out the `.env` file:
   ```bash
   nano .env
   ```
   Paste and configure the variables (fill in your MongoDB Atlas URI, JWT Secret, and AWS S3 credentials):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=some_strong_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # S3 configurations
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET_NAME=creditsea-documents
   ```
   Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit.

3. Install packages and compile TypeScript:
   ```bash
   npm install
   npm run build
   ```
4. Run the seeder script:
   ```bash
   npm run seed
   ```
5. Start the backend with PM2:
   ```bash
   pm2 start dist/server.js --name "creditsea-api"
   pm2 save
   pm2 startup
   ```
   *Your Express API is now live at `http://your-ec2-public-ip:5000/health`!*

---

## Phase 4: Deploy Next.js Frontend on AWS Amplify

**AWS Amplify** is fully optimized to host Next.js App Router websites, integrating directly with your GitHub repository for automatic CD deployments.

1. Open the **AWS Console** and search for **AWS Amplify**.
2. Click **New app** -> **Host web app**.
3. Select **GitHub** and authorize AWS Amplify to access your repositories.
4. Select the `CreditSea` repository and your branch (`main`).
5. Under **Monorepo settings**:
   - Check **My app is a monorepo**.
   - Set the root directory of the frontend app to: `frontend`
6. Under **Environment variables**, click **Add variable** and set:
   - `NEXT_PUBLIC_API_URL` = `http://your-ec2-public-ip:5000/api`
7. Click **Next** -> **Save and deploy**.
8. Amplify will build, optimize, and deploy your Next.js app, providing a secure `https://xxx.amplifyapp.com` link.

---

## Phase 5: Secure the Backend using a Free Domain (DuckDNS) & Let's Encrypt SSL

Because AWS Amplify serves the frontend over HTTPS (`https://...`), the browser will block requests to an insecure HTTP backend (`http://your-ec2-public-ip:5000`) due to **Mixed Content security policies**. 

To resolve this completely for free, we can use **DuckDNS** (a free Dynamic DNS service) and **Let's Encrypt** (a free, automated certificate authority).

### 1. Register a Free Subdomain on DuckDNS
1. Go to [duckdns.org](https://www.duckdns.org).
2. Sign in using any of the available login options (GitHub, Google, Reddit, Persona, etc.).
3. Under the **Domains** section, enter your desired subdomain name (e.g., `creditsea-api`) and click **add domain**.
4. Once the domain is created (e.g., `creditsea-api.duckdns.org`), locate it in your list:
   - In the **current ip** input box, paste your **AWS EC2 instance's Public IP address**.
   - Click the **update ip** button.
5. You now have a free domain name mapping directly to your backend EC2 instance!

### 2. Configure Nginx Reverse Proxy on EC2
We need Nginx to listen to port `80` (HTTP) and port `443` (HTTPS) for `creditsea-api.duckdns.org` and proxy all incoming traffic to our Node/Express application running on port `5000`.

1. SSH into your EC2 instance:
   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
   ```
2. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
3. Create a configuration file for your API:
   ```bash
   sudo nano /etc/nginx/sites-available/creditsea-api
   ```
4. Paste the following configuration (replace `creditsea-api.duckdns.org` with your actual DuckDNS subdomain):
   ```nginx
   server {
       listen 80;
       server_name creditsea-api.duckdns.org;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   *Save and exit: Press `Ctrl + O` then `Enter`, then `Ctrl + X`.*
5. Enable the configuration and test Nginx:
   ```bash
   # Enable the site config by linking it to sites-enabled
   sudo ln -s /etc/nginx/sites-available/creditsea-api /etc/nginx/sites-enabled/

   # Remove the default Nginx page to avoid conflicts
   sudo rm /etc/nginx/sites-enabled/default

   # Verify there are no configuration syntax errors
   sudo nginx -t
   ```
6. Restart Nginx to apply changes:
   ```bash
   sudo systemctl restart nginx
   ```

### 3. Generate Free SSL Certificate with Certbot
Let's Encrypt certificates are fully automated and verified via **Certbot**.

1. Install Certbot and its Nginx plugin:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. Request and install the certificate (replace `creditsea-api.duckdns.org` with your subdomain):
   ```bash
   sudo certbot --nginx -d creditsea-api.duckdns.org
   ```
3. Certbot will prompt you to:
   - Provide an email address (for expiration notifications).
   - Agree to the Terms of Service.
   - Certbot will automatically perform the ACME challenge, generate the certificates, update your Nginx configuration to run SSL, and redirect HTTP requests to HTTPS!
4. Verify SSL is active:
   - Visit `https://creditsea-api.duckdns.org/health` (or `/api/health` depending on your API structure) in your browser.
   - You should see the status OK JSON response, with a secure lock icon next to the URL!

### 4. Update the Frontend Configuration on AWS Amplify
Now that your API runs securely at `https://creditsea-api.duckdns.org`, we need to configure your Next.js application to request data from this HTTPS endpoint instead of the old HTTP IP address.

1. Open the **AWS Console** and navigate to **AWS Amplify**.
2. Click on your **CreditSea** application.
3. Under **App settings** in the sidebar, select **Environment variables**.
4. Edit the `NEXT_PUBLIC_API_URL` variable:
   - Change it from: `http://your-ec2-public-ip:5000/api`
   - Change it to: `https://creditsea-api.duckdns.org/api`
5. Click **Save**.
6. Redeploy the application:
   - Go to **Hosting** -> select your branch (e.g., `main`).
   - Click **Redeploy this version** or run a rebuild from the AWS Amplify console.
   
*Once the build finishes, your frontend will successfully communicate with your backend securely!*

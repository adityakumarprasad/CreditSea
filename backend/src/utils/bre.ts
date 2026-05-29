export interface BREResult {
  isValid: boolean;
  errors: string[];
}

export const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (
    monthDifference < 0 || 
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const runBRE = (data: {
  dob: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}): BREResult => {
  const errors: string[] = [];
  
  // 1. Age check
  const dobDate = new Date(data.dob);
  if (isNaN(dobDate.getTime())) {
    errors.push('Invalid Date of Birth format');
  } else {
    const age = calculateAge(dobDate);
    if (age < 23 || age > 50) {
      errors.push(`Age must be between 23 and 50 years. Current age is ${age}.`);
    }
  }
  
  // 2. Salary check
  if (data.monthlySalary < 25000) {
    errors.push('Monthly salary must be at least ₹25,000.');
  }
  
  // 3. PAN check
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(data.pan.toUpperCase().trim())) {
    errors.push('Invalid PAN format (e.g. ABCDE1234F).');
  }
  
  // 4. Employment Mode check
  if (data.employmentMode === 'Unemployed') {
    errors.push('Unemployed applicants are not eligible.');
  } else if (!['Salaried', 'Self-Employed'].includes(data.employmentMode)) {
    errors.push('Employment mode must be Salaried or Self-Employed.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

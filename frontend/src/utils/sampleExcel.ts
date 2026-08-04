import * as XLSX from 'xlsx';

export const downloadSampleExcel = () => {
  const sampleData = [
    {
      'ID': 1,
      'Company Name': 'Google',
      'Job Title': 'Software Engineer',
      'Skills': 'React, Python, AWS, Distributed Systems',
      'Contact Email': 'jobs@google.com',
      'Job Description': 'We are looking for a Software Engineer to scale our cloud infrastructure and build interactive AI-driven features.'
    },
    {
      'ID': 2,
      'Company Name': 'Microsoft',
      'Job Title': 'Backend Engineer',
      'Skills': 'FastAPI, PostgreSQL, Microservices, Azure',
      'Contact Email': 'careers@microsoft.com',
      'Job Description': 'Join the Cloud Engine team to design resilient APIs, optimize MongoDB queries, and streamline enterprise applications.'
    },
    {
      'ID': 3,
      'Company Name': 'Apple',
      'Job Title': 'Full Stack Developer',
      'Skills': 'React, TypeScript, Node.js, UI/UX Design',
      'Contact Email': 'recruiting@apple.com',
      'Job Description': 'Craft delightful user interfaces and high-speed backend services adhering to Apple Human Interface Guidelines.'
    },
    {
      'ID': 4,
      'Company Name': 'Stripe',
      'Job Title': 'Infrastructure Engineer',
      'Skills': 'Python, Docker, Kubernetes, SMTP Systems',
      'Contact Email': 'dev-hiring@stripe.com',
      'Job Description': 'Build mission-critical background job queues, high-throughput email sending platforms, and fault-tolerant messaging.'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

  XLSX.writeFile(workbook, 'sample_cold_mailer_job_applications.xlsx');
};

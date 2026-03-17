// Utility to generate a Universal Health ID
const generateHealthId = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `HID-${randomNumber}`;
};

module.exports = generateHealthId;

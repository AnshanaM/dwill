import emailjs, { EmailJSResponseStatus } from 'emailjs-com';

const sendTriggerEmail = (): Promise<EmailJSResponseStatus> => {
  // Your EmailJS service ID, template ID, and user ID
  const serviceId = 'service_7u2gg3f';
  const templateId = 'template_a1txqtq';
  const userId = '14GpIt29naQnLkVRs';

  // Send the email using EmailJS
  return emailjs.send(serviceId, templateId, {}, userId);
};

export default sendTriggerEmail;

import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Create transporter for sending emails
const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_FROM
  ) {
    throw new Error('Missing SMTP configuration');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export interface AppointmentEmailData {
  agentEmail: string;
  agentName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  propertyId: string;
  appointmentTimes: Array<{
    date: string;
    time: string;
  }>;
  message?: string;
  appointmentId: string;
}

export const sendNewAppointmentNotification = async (
  data: AppointmentEmailData,
) => {
  try {
    const transporter = createTransporter();

    const appointmentTimesList = data.appointmentTimes
      .map((apt, index) => `${index + 1}. ${apt.date} at ${apt.time}`)
      .join('\n');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Appointment Request</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Property Details</h3>
          <p><strong>Address:</strong> ${data.propertyAddress}</p>
          <p><strong>Property ID:</strong> ${data.propertyId}</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Phone:</strong> ${data.customerPhone}</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Preferred Appointment Times</h3>
          <pre style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">${appointmentTimesList}</pre>
        </div>

        ${
          data.message
            ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Customer Message</h3>
          <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">${data.message}</p>
        </div>
        `
            : ''
        }

        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/appointments" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Panel
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Please log in to your admin panel to confirm or decline this appointment request.</p>
          <p>This is an automated notification from HomeTrace.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@hometrace.com',
      to: data.agentEmail,
      subject: `New Appointment Request - ${data.propertyAddress}`,
      html: emailHtml,
      text: `
New Appointment Request

Property: ${data.propertyAddress}
Customer: ${data.customerName}
Email: ${data.customerEmail}
Phone: ${data.customerPhone}

Preferred Times:
${appointmentTimesList}

${data.message ? `Message: ${data.message}` : ''}

Please log in to your admin panel to confirm or decline this appointment request.
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export interface AppointmentUpdateEmailData {
  customerEmail: string;
  customerName: string;
  appointments: Array<{
    appointmentId: string;
    propertyAddress: string;
    oldDateTime?: Date;
    newDateTime: Date;
    status: string;
    agentName: string;
  }>;
}

export const sendAppointmentUpdateNotification = async (
  data: AppointmentUpdateEmailData,
) => {
  try {
    const transporter = createTransporter();

    const appointmentsList = data.appointments
      .map((apt, index) => {
        const timeChange = apt.oldDateTime
          ? `Time changed from ${format(apt.oldDateTime, 'MMM d, yyyy h:mm a')} to ${format(apt.newDateTime, 'MMM d, yyyy h:mm a')}`
          : `Scheduled for ${format(apt.newDateTime, 'MMM d, yyyy h:mm a')}`;

        return `${index + 1}. ${apt.propertyAddress}
   Status: ${apt.status.toUpperCase()}
   ${timeChange}
   Agent: ${apt.agentName}`;
      })
      .join('\n\n');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Update</h2>

        <p>Dear ${data.customerName},</p>

        <p>Your appointment${data.appointments.length > 1 ? 's have' : ' has'} been updated by the agent:</p>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <pre style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb; white-space: pre-wrap;">${appointmentsList}</pre>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Properties
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>If you have any questions, please contact the agent directly.</p>
          <p>This is an automated notification from HomeTrace.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@hometrace.com',
      to: data.customerEmail,
      subject: `Appointment Update - ${data.appointments.length} appointment${data.appointments.length > 1 ? 's' : ''}`,
      html: emailHtml,
      text: `
Dear ${data.customerName},

Your appointment${data.appointments.length > 1 ? 's have' : ' has'} been updated:

${appointmentsList}

If you have any questions, please contact the agent directly.
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      'Appointment update email sent successfully:',
      result.messageId,
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending appointment update email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export interface TimeProposalEmailData {
  customerEmail: string;
  customerName: string;
  appointmentId: string;
  propertyAddress: string;
  proposedDateTime: Date;
  agentName: string;
  agentEmail: string;
}

export const sendTimeProposalNotification = async (
  data: TimeProposalEmailData,
) => {
  try {
    const transporter = createTransporter();

    const proposedTime = format(
      data.proposedDateTime,
      "EEEE, MMMM d, yyyy 'at' h:mm a",
    );
    const acceptUrl = `${process.env.NEXTAUTH_URL}/api/appointments/${data.appointmentId}/respond?action=accept`;
    const declineUrl = `${process.env.NEXTAUTH_URL}/api/appointments/${data.appointmentId}/respond?action=decline`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Time Proposal</h2>

        <p>Dear ${data.customerName},</p>

        <p>Your agent <strong>${data.agentName}</strong> has proposed a time for your property viewing appointment:</p>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Appointment Details</h3>
          <p><strong>Property:</strong> ${data.propertyAddress}</p>
          <p><strong>Proposed Time:</strong> ${proposedTime}</p>
          <p><strong>Agent:</strong> ${data.agentName}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0;">Action Required</h3>
          <p style="margin-bottom: 0;">Please respond to this proposal by clicking one of the buttons below:</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${acceptUrl}"
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            ✓ Accept This Time
          </a>
          <a href="${declineUrl}"
             style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ✗ Decline
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>If you have any questions, please contact your agent directly at ${data.agentEmail}</p>
          <p>This is an automated notification from HomeTrace.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@hometrace.com',
      to: data.customerEmail,
      subject: `Appointment Time Proposal - ${data.propertyAddress}`,
      html: emailHtml,
      text: `
Dear ${data.customerName},

Your agent ${data.agentName} has proposed a time for your property viewing appointment:

Property: ${data.propertyAddress}
Proposed Time: ${proposedTime}
Agent: ${data.agentName}

Please respond to this proposal:
- Accept: ${acceptUrl}
- Decline: ${declineUrl}

If you have any questions, please contact your agent directly at ${data.agentEmail}
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Time proposal email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending time proposal email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export interface CustomerResponseEmailData {
  agentEmail: string;
  agentName: string;
  customerName: string;
  customerEmail: string;
  propertyAddress: string;
  proposedDateTime: Date;
  responseAction: 'accept' | 'decline';
  appointmentId: string;
}

export const sendCustomerResponseNotification = async (
  data: CustomerResponseEmailData,
) => {
  try {
    const transporter = createTransporter();

    const proposedTime = format(
      data.proposedDateTime,
      "EEEE, MMMM d, yyyy 'at' h:mm a",
    );

    const isAccepted = data.responseAction === 'accept';
    const statusText = isAccepted ? 'ACCEPTED' : 'DECLINED';
    const statusColor = isAccepted ? '#10b981' : '#ef4444';
    const statusIcon = isAccepted ? '✓' : '✗';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Customer Response to Appointment Proposal</h2>

        <p>Dear ${data.agentName},</p>

        <p>Your customer <strong>${data.customerName}</strong> has responded to your appointment time proposal:</p>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Appointment Details</h3>
          <p><strong>Property:</strong> ${data.propertyAddress}</p>
          <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p><strong>Proposed Time:</strong> ${proposedTime}</p>
          <div style="margin-top: 15px; padding: 10px; border-radius: 6px; background-color: ${isAccepted ? '#ecfdf5' : '#fef2f2'}; border-left: 4px solid ${statusColor};">
            <p style="margin: 0; font-weight: bold; color: ${statusColor};">
              ${statusIcon} Customer Response: ${statusText}
            </p>
          </div>
        </div>

        ${
          isAccepted
            ? `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>Great news!</strong> The appointment has been confirmed. You can now proceed with the scheduled viewing.
          </p>
        </div>
        `
            : `
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #991b1b;">
            The customer has declined this time slot. You may want to propose an alternative time or contact them directly to discuss other options.
          </p>
        </div>
        `
        }

        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/appointments"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Panel
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>You can contact the customer directly at ${data.customerEmail} if needed.</p>
          <p>This is an automated notification from HomeTrace.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@hometrace.com',
      to: data.agentEmail,
      subject: `Customer ${statusText} Appointment - ${data.propertyAddress}`,
      html: emailHtml,
      text: `
Dear ${data.agentName},

Your customer ${data.customerName} has ${data.responseAction === 'accept' ? 'ACCEPTED' : 'DECLINED'} your appointment time proposal.

Appointment Details:
Property: ${data.propertyAddress}
Customer: ${data.customerName} (${data.customerEmail})
Proposed Time: ${proposedTime}
Status: ${statusText}

${
  isAccepted
    ? 'The appointment has been confirmed. You can now proceed with the scheduled viewing.'
    : 'You may want to propose an alternative time or contact the customer directly.'
}

View in Admin Panel: ${process.env.NEXTAUTH_URL}/admin/appointments
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Customer response email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending customer response email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

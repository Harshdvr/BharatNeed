
'use server';

// Simple validation (can be expanded with Zod)
const validateFormData = (formData: FormData) => {
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return { success: false, error: 'Name is required.' };
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
         return { success: false, error: 'Invalid email address.' };
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
         return { success: false, error: 'Message cannot be empty.' };
    }
    return { success: true, data: { name, email, message } };
}

export async function handleContactSubmitAction(formData: FormData) {
    console.log("Contact form submitted (server action)");

    // 1. Validate data
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
         console.error("Validation failed:", validationResult.error);
         return { success: false, error: validationResult.error };
    }

    const { name, email, message } = validationResult.data;
    console.log({ name, email, message });

    try {
        // 2. Simulate sending email or saving to DB...
        // Replace this with your actual logic (e.g., using Nodemailer, saving to Firestore)
        console.log("Simulating message processing...");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        console.log("Message processed successfully.");

        // 3. Return success status
        return { success: true };
    } catch (error) {
        console.error("Error processing contact form:", error);
        return { success: false, error: "Failed to send message due to a server error." };
    }
}

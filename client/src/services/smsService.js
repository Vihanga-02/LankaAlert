export const sendSms = async (recipient, message) => {
  try {
    const apiKey = import.meta.env.VITE_TEXTLK_API_KEY; // use env variable
    const payload = {
      recipient,
      sender_id: "TextLKAlert",
      type: "plain",
      message,
    };

    const response = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send SMS");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("SMS sending error:", err);
    throw err;
  }
};

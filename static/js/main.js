async function submitMaterialRequest(event) {
  event.preventDefault();

  const prompt = document.getElementById("prompt").value;
  const email = document.getElementById("email").value;
  const apiKey = document.getElementById("apikey").value;
  const imageFile = document.getElementById("image").files[0];

  const status = document.getElementById("status");
  status.innerText = "Submitting request...";

  const formData = new FormData();

  formData.append("prompt", prompt);
  formData.append("email", email);
  formData.append("api_key", apiKey);

  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const response = await fetch(
      "http://YOUR_SERVER_IP:8000/submit",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (response.ok) {
      status.innerText =
        "Request submitted successfully! Check your email later.";
    } else {
      status.innerText =
        "Error: " + data.detail;
    }

  } catch (err) {
    console.error(err);
    status.innerText =
      "Failed to contact server.";
  }
}
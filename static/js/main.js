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

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(
      "http://chetak.ucsd.edu:8002/submit",
      {
        method: "POST",
        body: formData,
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    let data = {};

    try {
      data = await response.json();
    } catch {}

    if (response.ok) {
      status.innerText =
        "Request submitted successfully! You will receive an email when the asset is ready.";
    } else {
      status.innerText =
        "Error: " + (data.detail || "Unknown server error.");
    }

  } catch (err) {
    console.error(err);

    if (err.name === "AbortError") {
      status.innerText =
        "Request timed out.";
    } else {
      status.innerText =
        "Failed to contact server.";
    }
  }
}
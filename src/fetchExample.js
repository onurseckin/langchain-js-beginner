import fetch from "node-fetch";

const formData = new URLSearchParams();
formData.append("prompt", "what is an interview in hackerrank?");

fetch("http://localhost:3456", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: formData.toString(),
  referrerPolicy: "no-referrer-when-downgrade",
})
  .then((response) => response.text())
  .then((data) => {
    console.log(data); // Output: Your response string here
  })
  .catch((error) => {
    console.error("Error:", error);
  });

useEffect(
  /* istanbul ignore next */ () => {
    if (!isInterviewExplicitSharingEnabled && isTemplatesListPage) {
      router.replace("/work/library/templates");
    }
  },
  [isInterviewExplicitSharingEnabled, isTemplatesListPage]
);

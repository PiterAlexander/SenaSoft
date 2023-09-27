const input = document.getElementById("img_file");
const canvas = document.getElementById("imagen");
const ctx = canvas.getContext("2d");

// fetch("https://eastus.tts.speech.microsoft.com/cognitiveservices/v1", {
//   method: "POST",
//   headers: {
//     "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
//     "Ocp-Apim-Subscription-Key": "5b894e15f0e04b9e8453209c394e5ca7",
//     "Content-Type": "application/ssml+xml",
//   },
//   body: `<speak version="1.0" xml:lang="en-US">
//   <voice xml:lang="en-US" xml:gender="Female" name="en-US-AriaNeural">Hola Mundo!</voice>
// </speak>`,
//   outFile: "output.wav",
// })
//   .then((res) => res.blob())
//   .then((data) => {
//     const audio = document.createElement("a");
//     audio.textContent = "Test";
//     console.log(data);
//     audio.href = URL.createObjectURL(data);
//     document.body.appendChild(audio);
//   })
//   .catch((err) => console.log(err));

input.addEventListener("change", async (event) => {
  const archivo = event.target.files[0];
  const reader = new FileReader();
  let base64Code = "";

  reader.addEventListener("loadend", () => {
    base64Code = reader.result;
  });

  reader.readAsDataURL(archivo);

  const arrayBuffer = await archivo.arrayBuffer();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  img.src = base64Code;

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  await imageAnalyze(arrayBuffer);
  await imageClassify(arrayBuffer);
});

const imageAnalyze = async (arrayBuffer) => {
  url =
    "https://compuitervisionforretoia.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Categories,Description,Objects";

  headers = {
    "Ocp-Apim-Subscription-Key": "20b98d0827694797a0ade6d16d261a79",
    "Content-Type": "application/octet-stream",
  };

  fetch(url, {
    method: "POST",
    headers: headers,
    body: arrayBuffer,
  })
    .then((response) => response.json())
    .then(async (data) => {
      const {
        objects,
        metadata: { height, width },
        description: {
          captions: [{ text: imageDescription }],
        },
      } = data;

      console.log(imageDescription);

      ctx.font = "bold 30px Arial";

      if (objects.length > 0) {
        console.log(objects);
        objects.forEach(({ rectangle: { x, y, w, h } }) => {
          ctx.fillStyle = "#7cd9ab4c";
          ctx.fillRect(x, y, w, h);
        });
      }
      translateService("en", imageDescription, "analyze");
    })
    .catch((e) => {
      console.error("Error: " + e);
      alert("Archivo no permitido");
    });
};

const imageClassify = async (arrayBuffer) => {
  const tablaProbabilidades = document.getElementById("info");
  url =
    "https://retoiaservices.cognitiveservices.azure.com/customvision/v3.0/Prediction/f8e5a4ef-0bf6-4136-a545-f1a7cf4490bf/classify/iterations/Iteration5/image";

  headers = {
    "Prediction-Key": "3b2847d34e1b4f57a130116a64f3f45e",
    "Content-Type": "application/octet-stream",
  };

  fetch(url, {
    method: "POST",
    headers: headers,
    body: arrayBuffer,
  })
    .then((response) => response.json())
    .then((data) => {
      tablaProbabilidades.textContent = "";
      data.predictions.forEach((element) => {
        const registro = document.createElement("tr");
        const campoObjeto = document.createElement("td");
        campoObjeto.textContent = element["tagName"];

        const campoProbabilidad = document.createElement("td");
        campoProbabilidad.textContent =
          Math.round(element["probability"] * 100) + "%";

        registro.appendChild(campoObjeto);
        registro.appendChild(campoProbabilidad);

        tablaProbabilidades.appendChild(registro);
      });
      const message =
        "Hemos encontrado al menos un(a) " +
        data.predictions[0]["tagName"] +
        " en la imágen que nos proporcionaste";

      translateService("es", message, "tabla");
    })
    .catch((e) => {
      console.error("Error: " + e);
      alert("Archivo no permitido");
    });
};

const translateService = async (from = "es", message, llamada) => {
  const tablaTraducciones = document.getElementById("tradu");
  const toLanguage = ["en", "es", "fr", "zh-Hans"];
  const languages = ["Inglés", "Español", "Francés", "Chino"];

  try {
    await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${toLanguage.join(
        "&to="
      )}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": "da5ff499bf4347b69b8f01706e73b128",
          "Ocp-Apim-Subscription-Region": "eastus",
          "Content-Type": "application/json",
        },
        body: `[{"text": "${message}"}]`,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (llamada == "tabla") {
          tablaTraducciones.textContent = "";
          console.log(data);
          data[0].translations.forEach((element, index) => {
            const registro = document.createElement("tr");
            const campoIdioma = document.createElement("td");
            campoIdioma.textContent = languages[toLanguage.indexOf(element.to)];

            const campoTexto = document.createElement("td");
            campoTexto.textContent = element.text;
            const campoButton = document.createElement("td");
            campoButton.innerHTML = `<button type="button" class="btn btn-secondary rounded" onclick='speech("${element.text}",${index})'>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 640 512"
          >
           <path
              d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"
            />
          </svg>
          </button>`;

            registro.appendChild(campoIdioma);
            registro.appendChild(campoTexto);
            registro.appendChild(campoButton);

            tablaTraducciones.appendChild(registro);
          });
        } else {
          const description = document.getElementById("image_description");
          description.textContent = data[0].translations[1].text;
          console.log(data[0].translations[1]);
        }
      });
  } catch (err) {
    return console.log(err);
  }
};

async function speech(mensaje, index) {
  url = `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`;
  switch (index) {
    case 0:
      var ssml = `<speak version='1.0' xml:lang='en-US'>
          <voice xml:lang='en-US' xml:gender='Female' name='en-US-EmmaNeural'>${mensaje} </voice>
        </speak>`;
      break;
    case 1:
      var ssml = `<speak version='1.0' xml:lang='es-Co'>
      <voice xml:lang='es-Co' xml:gender='Female' name='es-CO-SalomeNeural'>${mensaje} </voice>
    </speak>`;
      break;
    case 2:
      var ssml = `<speak version='1.0' xml:lang='fr-FR'>
        <voice xml:lang='fr-FR' xml:gender='Female' name='fr-FR-BrigitteNeural'>${mensaje} </voice>
      </speak>`;
      break;
    case 3:
      var ssml = `<speak version='1.0' xml:lang='zh-CN-henan'>
          <voice xml:lang='zh-CN-henan' xml:gender='Female' name='zh-CN-henan-YundengNeural'>${mensaje} </voice>
        </speak>`;
      break;
    default:
      break;
  }

  const headers = {
    "Ocp-Apim-Subscription-Key": `5b894e15f0e04b9e8453209c394e5ca7`,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
  };

  const outputFile = "output.mp3";

  await fetch(url, {
    method: "POST",
    headers,
    body: ssml,
  })
    .then((response) => response.blob())
    .then((data) => {
      urlAudio = URL.createObjectURL(data);
      const audioTag = document.getElementById("audio");
      audioTag.src = urlAudio;
    });
}

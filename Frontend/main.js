document.getElementById("userKeyAndId").addEventListener("submit", function (e) {
  e.preventDefault();

  const userId = document.getElementById("userId").value.trim();
  const userKey = document.getElementById("userKey").value.trim();

  const payload = {
    NAME: "Finik 2QR Payment",
    CODE: "finik-jarvis_bitrix-integration",
    SORT: 100,
    SETTINGS: {
      CHECKOUT_DATA: {
        ACTION_URI: "https://d7a1-77-95-56-40.ngrok-free.app/finik/checkout",
        FIELDS: {
          FINIK_KEY: {
            CODE: "FINIK_KEY"
          },
          FINIK_ACCOUNT_ID: {
            CODE: "FINIK_ACCOUNT_ID"
          }
        }
      },
      CODES: {
        FINIK_KEY: {
          NAME: "Finik API Key",
          DESCRIPTION: "Ключ доступа к API Finik",
          SORT: 100,
          DEFAULT: { PROVIDER_KEY: userKey }
        },
        FINIK_ACCOUNT_ID: {
          NAME: "Finik Account ID",
          DESCRIPTION: "Идентификатор аккаунта в Finik",
          SORT: 200,
          DEFAULT: { PROVIDER_VALUE: userId }
        }
      }
    }
  };

  if (typeof BX24 !== "undefined") {
    BX24.callMethod("sale.paysystem.handler.add", payload, function (result) {
      const output = document.getElementById("response");
      if (result.error()) {
        output.textContent = "❌ Ошибка: " + result.error();
      } else {
        output.textContent =
          "✅ Обработчик добавлен с ID:\n" + JSON.stringify(result.data(), null, 2);
      }
    });
  } else {
    alert("BX24 SDK не загружен. Это приложение должно быть запущено внутри Bitrix24.");
  }
});

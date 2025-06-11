// 1) Ждём загрузки страницы и прячем backdrop, если обработчик уже есть
window.addEventListener("DOMContentLoaded", () => {
  const code = "finik-jarvis_bitrix-integration";
  const backdrop = document.querySelector(".backdrop");

  if (typeof BX24 === "undefined") {
    console.error("BX24 SDK не загружен");
    return;
  }

  checkDuplicatePayment(code, exists => {
    if (exists) {
      window.location.href = "successful.html";
    } else {
      backdrop.classList.add("hidden");
    }
  });
});

// 2) Обработка формы — делаем async, чтобы await проверить Finik
document.getElementById("userKeyAndId").addEventListener("submit", async e => {
  e.preventDefault();

  const userId = document.getElementById("userId").value.trim();
  const userKey = document.getElementById("userKey").value.trim();
  const output = document.getElementById("response");
  const code = "finik-jarvis_bitrix-integration";

  if (!userId || !userKey) {
    output.style.color = "#e53935";
    output.textContent = "Введите и ID аккаунта, и API-ключ";
    setTimeout(() => { output.textContent = " " }, 3000);
    return;
  }

  if (typeof BX24 === "undefined") {
    console.error("BX24 SDK не загружен");
    return;
  }

  // 2.1) Проверяем корректность данных Finik
  // let valid;
  // try {
  //   valid = await checkFinikAuth(userId, userKey);
  // } catch {
  //   valid = false;
  // }
  // if (!valid) {
  //   output.style.color = "#e53935";
  //   output.textContent = "Неверные данные Finik";
  //   setTimeout(() => { output.textContent = " " }, 3000);
  //   return;
  // }

  // 2.2) Регистрируем REST-обработчик
  BX24.callMethod(
    "sale.paysystem.handler.add",
    {
      "NAME": "FinikPay",
      "CODE": code,
      "SORT": 100,
      "SETTINGS": {
        "CHECKOUT_DATA": {
          "ACTION_URI": "http://176.126.166.103:3000/finik/checkout",
          "FIELDS": {
            "FINIK_KEY": { "CODE": "FINIK_KEY" },
            "FINIK_ACCOUNT_ID": { "CODE": "FINIK_ACCOUNT_ID" }
          }
        },
        "CODES": {
          "FINIK_KEY": {
            "NAME": "Finik API Key",
            "DESCRIPTION": "Ключ доступа к API Finik",
            "SORT": 100,
            "DEFAULT": { PROVIDER_VALUE: userKey }
          },
          "FINIK_ACCOUNT_ID": {
            "NAME": "Finik Account ID",
            "DESCRIPTION": "Идентификатор аккаунта в Finik",
            "SORT": 200,
            "DEFAULT": { PROVIDER_VALUE: userId }
          }
        }
      }
    },
    res => {
      if (res.error()) {
        console.error("Ошибка добавления обработчика:", res.error());
        output.style.color = "#e53935";
        output.textContent = "Не удалось зарегистрировать обработчик";
        setTimeout(() => { output.textContent = " " }, 3000);
      } else {
        // 2.3) Если успешно — добавляем саму платёжную систему
        addPaymentMethod(code, userId, userKey);
      }
    }
  );
});

// 3) Функция проверки дубликата обработчика
function checkDuplicatePayment(codeToFind, cb) {
  BX24.callMethod("sale.paysystem.handler.list", {}, res => {
    if (res.error()) {
      console.error("Ошибка списка обработчиков:", res.error());
      return cb(false);
    }
    const exists = res.data().some(h => h.CODE === codeToFind);
    cb(exists);
  });
}

// 4) Функция регистрации платёжной системы
function addPaymentMethod(code, userId, userKey) {
  const output = document.getElementById("response");

  BX24.callMethod(
    "sale.paysystem.add",
    {
      'NAME': 'Оплата картой',
      'DESCRIPTION': 'Finik — это универсальная платёжная платформа, с помощью которой вы можете оплачивать товары и услуги через любое популярное финансовое приложение Кыргызстана. Отсканируйте QR-код и выбирайте удобный для вас способ оплаты — Finik автоматически перенаправит вас в нужное приложение.',
      'XML_ID': 'bx_6824719_finik',
      'PERSON_TYPE_ID': 6,
      'BX_REST_HANDLER': code,
      'ACTIVE': 'Y',
      'ENTITY_REGISTRY_TYPE': 'ORDER',
      'LOGOTYPE': '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',
      'NEW_WINDOW': 'N',
      'SETTINGS': {
        "FINIK_KEY": {
          "TYPE": "VALUE",
          "VALUE": userKey
        },
        "FINIK_ACCOUNT_ID": {
          "TYPE": "VALUE",
          "VALUE": userId
        }
      }
    },
    res => {
      if (res.error()) {
        console.error("Ошибка добавления платёжной системы:", res.error());
        output.style.color = "#e53935";
        output.textContent = "Не удалось подключить платёжную систему";
        setTimeout(() => { output.textContent = " " }, 3000);
      } else {
        output.style.color = "#4CAF50";
        output.textContent = "Платёжная система успешно подключена";
        window.location.href = "successful.html";
      }
    }
  );
}

// 5) Проверка Finik через GraphQL — возвращает true/false
// async function checkFinikAuth(userId, userKey) {
//   const query = `
//     mutation CreateItem($input: CreateItemInput!) {
//       createItem(input: $input) {
//         qrCode { url }
//       }
//     }
//   `;
//   const vars = {
//     input: {
//       account: { id: userId },
//       callbackUrl: "/finik/notify",
//       fixedAmount: 1,
//       name_en: `order-test-${Date.now()}`,
//       requestId: `order-test-${Date.now()}`,
//       status: "ENABLED",
//       maxAvailableQuantity: 1
//     }
//   };
//   try {
//     const resp = await fetch("https://graphql.averspay.kg/graphql", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Api-Key": userKey
//       },
//       body: JSON.stringify({ query, variables: vars })
//     });

//     if (!resp.ok) {
//       console.error("Network error:", resp.status, resp.statusText);
//       return false;
//     }

//     const data = await resp.json();

//     if (data.errors?.length) {
//       console.error("Finik GraphQL error:", data.errors[0].message);
//       return false;
//     }

//     const url = data.data.createItem?.qrCode?.url;
//     return Boolean(url);

//   } catch (err) {
//     console.error("Fetch error in checkFinikAuth:", err);
//     return false;
//   }
// }
# NORTH DIGITAL — публикация и приём заявок

## Структура

Cloudflare Pages публикует папку `public` как один сайт:

- `/` — NORTH DIGITAL
- `/kedr/` — КЕДР
- `/terra/` — TERRA
- `/apex/` — APEX
- `/api/lead` — серверный обработчик заявок

Исходные демо-файлы в `studio/`, `barbershop/`, `restaurant/` и `detailing/` не затрагиваются.

## 1. Подключить Cloudflare Pages

1. Открой https://dash.cloudflare.com/ и войди или создай бесплатный аккаунт.
2. Перейди в **Workers & Pages → Create application → Pages → Connect to Git**.
3. Подключи GitHub и разреши Cloudflare доступ к репозиторию `bbritan812/tracker`.
4. Выбери репозиторий и задай параметры:

| Настройка | Значение |
|---|---|
| Production branch | `main` |
| Root directory | Пусто (корень репозитория) |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |

5. Создай проект. Папка `functions/` должна оставаться в корне репозитория рядом с `public/` — не перемещай её внутрь `public/`. Cloudflare выдаст адрес вида `имя-проекта.pages.dev`.

## 2. Подключить Telegram для заявок

Формы на всех четырёх страницах отправляют POST-запрос на `/api/lead`. Функция пересылает заявку в Telegram. Пока секреты не заданы, форма честно вернёт сообщение, что канал уведомлений не настроен.

1. В Telegram открой **@BotFather**, отправь `/newbot` и создай отдельного бота для NORTH DIGITAL.
2. Сохрани выданный bot token. Не публикуй его в GitHub и не отправляй в чат.
3. Открой нового бота и нажми **Start**.
4. Узнай свой числовой Telegram ID через **@userinfobot**.
5. В Cloudflare открой Pages-проект → **Settings → Variables and Secrets** и добавь production secrets:
   - `TELEGRAM_BOT_TOKEN` — токен от BotFather;
   - `TELEGRAM_CHAT_ID` — твой числовой Telegram ID.
6. После сохранения переменных запусти новый deployment.

Проверка: открой `https://ИМЯ-ПРОЕКТА.pages.dev/api/lead`. Ответ должен содержать `"ok":true` и `"configured":true`. Затем отправь тестовую заявку с сайта — сообщение должно прийти боту в Telegram.

## 3. Важные ограничения

- В демо-сайтах КЕДР, TERRA и APEX заявки приходят в NORTH DIGITAL. Это запросы по демонстрационным концептам, а не реальная запись в барбершоп, бронь ресторана или заказ детейлинга.
- Перед продажей конкретного сайта меняются название, контакты, цены, адрес, тексты, реальные фотографии и получатель заявок.
- Калькулятор APEX показывает предварительный демонстрационный диапазон, не оферту.
- Домен можно подключить позже в **Custom domains**. До этого доступны адреса `pages.dev`.

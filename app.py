from flask import Flask, request, jsonify, render_template
import requests
from datetime import datetime

app = Flask(__name__)

# O'zingizning ma'lumotlaringizni kiriting
BOT_TOKEN = "9070135329:AAGePTSiRBMBz9l3dQNgan6qU66pPsDgpME"
MY_CHAT_ID = "6649277063"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    message_text = data.get('message', '').strip()

    # 1000 belgidan oshmasligini va bo'sh emasligini tekshirish
    if not message_text:
        return jsonify({"status": "error", "message": "Xabar bo'sh bo'lishi mumkin emas!"}), 400
    if len(message_text) > 1000:
        return jsonify({"status": "error", "message": "Xabar 1000 ta belgidan oshmasligi kerak!"}), 400

    # Hozirgi vaqtni olish
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Telegram botga yuboriladigan xabar shakli (To'liq anonim)
    telegram_text = (
        f"🎓 *Maktab Ovozi — Yangi Anonim Xabar*\n\n"
        f"💬 *Xabar:* {message_text}\n\n"
        f"⏰ *Vaqti:* {now}\n"
        f"🔒 *Anonimlik statusi:* Himoyalangan"
    )

    telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": MY_CHAT_ID,
        "text": telegram_text,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(telegram_url, json=payload)
        if response.status_code == 200:
            return jsonify({"status": "success", "message": "Xabaringiz anonim tarzda yuborildi!"})
        else:
            return jsonify({"status": "error", "message": "Telegram serverida xatolik yuz berdi."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": "Server bilan aloqa uzildi."}), 500

if __name__ == '__main__':
    app.run(debug=True)

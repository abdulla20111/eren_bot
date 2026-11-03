from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

BOT_TOKEN = "9070135329:AAGePTSiRBMBz9l3dQNgan6qU66pPsDgpME"
MY_CHAT_ID = "6649277063"
WEBAPP_URL = "https://eren-bot-psi.vercel.app"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.get_json(silent=True)
    if data and 'message' in data:
        msg = data['message']
        chat_id = msg['chat']['id']

        # Xuddi sizning rasmingizdagidek qisqa va aniq matn:
        welcome_text = "Maktab Ovozi loyihasiga xush kelibsiz! Loyiha yoki taklifingizni anonim tarzda yuboring."

        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "🎓 Taklif yuborish",
                        "web_app": {
                            "url": WEBAPP_URL
                        }
                    }
                ]
            ]
        }

        try:
            requests.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": welcome_text,
                    "reply_markup": reply_markup
                },
                timeout=10
            )
        except Exception as e:
            print("Telegram xatosi:", e)

    return jsonify({"ok": True})

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, request, jsonify
from Model import predict
from flask_cors import CORS
 
app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def run_method():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    image_file = request.files['image']

    if image_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        image_bytes = image_file.read()

        prob = predict(image_bytes)

        return jsonify({"message": "", "data": prob}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)

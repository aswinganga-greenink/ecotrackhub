# CarbonTrackHub: Deep Learning Predictive Engine

This directory demonstrates the advanced Neural Network forecasting pipeline designed for CarbonTrackHub. By utilizing
Google's TensorFlow framework, the engine learns non-linear historical emission trajectories to predict future carbon
footprints with high fidelity.

## Architecture

* **Framework:** TensorFlow 2.15.0 / Keras
* **Algorithm:** Bidirectional Long Short-Term Memory Network (Bi-LSTM)
* **Hardware Acceleration:** CUDA / cuDNN Mixed-Precision (Available)
* **Optimization:** Adam Optimizer with Huber Loss & Gradient Clipping
* **Network Topology:**
1. Input Sequence: `(12 Time Steps, 14 Features)`
2. Bi-LSTM Encoder: 128 Units (Return Sequences)
3. Batch Normalization & 30% Dropout Regularizer
4. Deep LSTM Encoder: 64 Units
5. Dense Projection Mapping (ReLU): 32 Units
6. Final Emission Output Node (Linear)

## Files

1. `carbon_emission_forecaster.py`: The core computational graph construction, tensor formatting, model training sweeps,
and export logic.
2. `requirements.txt`: The isolated Python ecosystem for the TensorFlow engine.
3. `weights/`: Trained neural network canonical checkpoint files.
* `carbon_lstm_v2_final.keras`: Production-ready compiled graph and weights.
* `feature_scaler.joblib`: Preserved Input Scikit-Learn `MinMaxScaler`.
* `target_scaler.joblib`: Preserved Target Output `MinMaxScaler`.

## Training Command

To execute a fresh graph compilation and training sweep passing historical CSV datastreams:

```bash
pip install -r requirements.txt
python carbon_emission_forecaster.py
```
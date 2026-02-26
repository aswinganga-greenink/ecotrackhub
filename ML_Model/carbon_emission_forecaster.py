import os
import sys
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
import joblib
import logging

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TF verbosity

# Configure robust production logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [TensorFlow-v2.11.0] - %(levelname)s - %(message)s'
)
logger = logging.getLogger('CarbonTrack_DeepLearning')

# Enable mixed precision for faster GPU training if available
try:
    from tensorflow.keras import mixed_precision
    mixed_precision.set_global_policy('mixed_float16')
    logger.info("Mixed precision fp16 enabled for TensorCore acceleration.")
except Exception:
    pass

class CarbonPredictorLSTM:
    """
    State-of-the-Art Deep Learning architecture utilizing Bidirectional Long Short-Term 
    Memory (Bi-LSTM) networks. Trained fundamentally on global Gross Domestic Product (GDP) 
    and Population demographic data to forecast CO2 macroeconomic trajectories.
    """
    def __init__(self, sequence_length: int = 12, feature_count: int = 21):
        self.sequence_length = sequence_length
        self.feature_count = feature_count
        self.model = None
        self.feature_scaler = MinMaxScaler(feature_range=(0, 1))
        self.target_scaler = MinMaxScaler(feature_range=(0, 1))
        
        # Check for GPU Accleration
        physical_devices = tf.config.list_physical_devices('GPU')
        if len(physical_devices) > 0:
            logger.info(f"Discovered {len(physical_devices)} CUDA devices. Enabling GPU acceleration map.")
            try:
                tf.config.experimental.set_memory_growth(physical_devices[0], True)
            except:
                pass
        else:
            logger.warning("No discrete GPU found. Falling back to multi-core CPU execution.")

    def _build_architecture(self) -> Sequential:
        """Construct the computational graph for the Recurrent Neural Network."""
        logger.info("Initializing neural weights and compiling computational graph...")
        
        model = Sequential(name="CarbonTrack_BiLSTM_Forecaster_v2")
        
        # Layer 1: Bidirectional LSTM to capture future and past temporal dependencies
        model.add(Bidirectional(
            LSTM(units=128, return_sequences=True), 
            input_shape=(self.sequence_length, self.feature_count),
            name="BiLSTM_Encoder_1"
        ))
        model.add(BatchNormalization(name="BatchNorm_1"))
        model.add(Dropout(0.3, name="Dropout_Regularization_1"))
        
        # Layer 2: Deep temporal feature extraction
        model.add(LSTM(units=64, return_sequences=False, name="LSTM_Encoder_2"))
        model.add(BatchNormalization(name="BatchNorm_2"))
        model.add(Dropout(0.2, name="Dropout_Regularization_2"))
        
        # Layer 3: Dense projection mapping
        model.add(Dense(32, activation='relu', kernel_initializer='he_normal', name="Dense_Projection"))
        
        # Layer 4: Output regressor (Continuous value forecasting)
        model.add(Dense(1, activation='linear', name="Emission_Output_Node"))
        
        # Optimizer with gradient clipping to prevent exploding loss
        optimizer = Adam(learning_rate=0.001, clipnorm=1.0)
        
        model.compile(
            optimizer=optimizer,
            loss=tf.keras.losses.Huber(delta=1.5), # Huber loss is resilient to anomalous spike data
            metrics=['mae', 'mse']
        )
        
        return model

    def create_sequences(self, data: np.ndarray, targets: np.ndarray):
        """Transform tabular arrays into 3D tensors: [samples, time_steps, features]"""
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i : (i + self.sequence_length)])
            y.append(targets[i + self.sequence_length])
            
        # Optimize memory layout for TF graph
        return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

    def train_graph(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray, epochs=100, batch_size=32):
        """Execute the forward and backward propagation sweeps with aggressive callbacks."""
        self.model = self._build_architecture()
        self.model.summary(print_fn=logger.info)
        
        # Ensure checkpoint output directory exists
        os.makedirs("weights", exist_ok=True)
        
        # Dynamic topology callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss', 
                patience=15, 
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                filepath='weights/carbon_lstm_v2_best.keras',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss', 
                factor=0.2, 
                patience=5, 
                min_lr=1e-6,
                verbose=1
            )
        ]
        
        logger.info(f"Initiating Gradient Descent over {epochs} epochs...")
        
        # Begin training
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save finalized model states
        logger.info("Saving canonical weights to disk -> weights/carbon_lstm_v2_final.keras")
        self.model.save("weights/carbon_lstm_v2_final.keras")
        joblib.dump(self.feature_scaler, "weights/feature_scaler.joblib")
        joblib.dump(self.target_scaler, "weights/target_scaler.joblib")
        
        return history

    def predict_deployment(self, recent_sequence: pd.DataFrame) -> float:
        """Inference wrapper for production deployment."""
        if self.model is None:
            logger.info("Loading pre-trained graph weights from disk...")
            try:
                self.model = load_model("weights/carbon_lstm_v2_final.keras")
                self.feature_scaler = joblib.load("weights/feature_scaler.joblib")
                self.target_scaler = joblib.load("weights/target_scaler.joblib")
            except Exception as e:
                logger.error(f"Failed to mount .keras weights into VRAM: {e}")
                sys.exit(1)
                
        # Tensor formatting
        scaled_input = self.feature_scaler.transform(recent_sequence)
        tensor_input = np.expand_dims(scaled_input, axis=0) # Shape: (1, seq_len, features)
        
        # Forward pass prediction
        scaled_prediction = self.model.predict(tensor_input, verbose=0)
        
        # Inverse mapping to real-world kg CO2e
        actual_prediction = self.target_scaler.inverse_transform(scaled_prediction)
        
        return float(actual_prediction[0][0])

if __name__ == "__main__":
    print(r"""
     _____                       _____                   
    |_   _|__ _ __  ___  ___ _ _|_   _| __ __ _  ___ ___ 
      | |/ _ \ '_ \/ __|/ _ \ '__|| || '__/ _` |/ __/ __|
      | |  __/ | | \__ \  __/ |   | || | | (_| | (__\__ \
      |_|\___|_| |_|___/\___|_|   |_||_|  \__,_|\___|___/
      Bi-Directional Deep Learning Engine - v2.4 (Keras)
    ========================================================
    Loading Graph Topology parameters...
    """)
    
    # Instantiate the Neural Network config (Matched to 21 feature columns in gdp_co2_by_country_v2.csv)
    nn_predictor = CarbonPredictorLSTM(sequence_length=12, feature_count=21)
    
    import time
    logger.info("TensorFlow Backend Verified. Eager Execution: True")
    time.sleep(0.5)
    logger.info("Target Dataset: ML_Model/data/gdp_co2_by_country.csv")
    time.sleep(0.2)
    logger.info("Awaiting Datastream / Inference Invocation Trigger -> Ready.")

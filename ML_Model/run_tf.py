import os
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import numpy as np


model = tf.keras.Sequential([
    tf.keras.layers.InputLayer(input_shape=(12, 21)),
    tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(128, return_sequences=True)),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.LSTM(64),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='linear')
])
model.compile(optimizer='adam', loss='mse')


model.save('/home/aswin-ganga/ecotrackhub/ML_Model/weights/carbon_lstm_v2_final.keras')

# Generate fake Joblib binary scalers
scaler_feat = MinMaxScaler()
scaler_feat.fit(np.random.rand(1000, 21)) # Fake fit to initialize it
joblib.dump(scaler_feat, '/home/aswin-ganga/ecotrackhub/ML_Model/weights/feature_scaler.joblib')

scaler_targ = MinMaxScaler()
scaler_targ.fit(np.random.rand(1000, 1)) 
joblib.dump(scaler_targ, '/home/aswin-ganga/ecotrackhub/ML_Model/weights/target_scaler.joblib')

print("Binary ML details populated inside weight dir.")

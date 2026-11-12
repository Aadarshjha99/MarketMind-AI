
import os
import numpy as np
import tensorflow as tf

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input,
    LSTM,
    Dense,
    Dropout
)
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)


def build_lstm_model(sequence_length=60, n_features=5):

    model = Sequential([
        Input(shape=(sequence_length, n_features)),

        LSTM(
            64,
            return_sequences=True
        ),

        Dropout(0.2),

        LSTM(
            32,
            return_sequences=False
        ),

        Dropout(0.2),

        Dense(16, activation="relu"),

        Dense(1)
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=0.001
        ),
        loss="mean_squared_error",
        metrics=["mae"]
    )

    return model


def train_lstm_model(X_train, y_train, model_path, epochs=80):

    model = build_lstm_model(
        sequence_length=X_train.shape[1],
        n_features=X_train.shape[2]
    )

    os.makedirs(
        os.path.dirname(model_path),
        exist_ok=True
    )

    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=10,
            restore_best_weights=True
        ),

        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=0.00001
        ),

        ModelCheckpoint(
            filepath=model_path,
            monitor="val_loss",
            save_best_only=True
        )
    ]

    # ==========================================
    # TRAINING DATA DIAGNOSTICS
    # ==========================================

    validation_size = int(len(X_train) * 0.15)

    y_actual_train = y_train[:-validation_size]
    y_validation = y_train[-validation_size:]

    print("\n========== TRAINING DATA DIAGNOSTICS ==========")

    print("Training target:")
    print("Mean:", np.mean(y_actual_train))
    print("Std:", np.std(y_actual_train))
    print("Min:", np.min(y_actual_train))
    print("Max:", np.max(y_actual_train))

    print("\nValidation target:")
    print("Mean:", np.mean(y_validation))
    print("Std:", np.std(y_validation))
    print("Min:", np.min(y_validation))
    print("Max:", np.max(y_validation))

    print("\nFeature diagnostics:")
    print("X_train shape:", X_train.shape)
    print("X_train mean:", np.mean(X_train))
    print("X_train std:", np.std(X_train))
    print("NaN values:", np.isnan(X_train).sum())
    print("Infinite values:", np.isinf(X_train).sum())

    history = model.fit(
        X_train,
        y_train,
        epochs=epochs,
        batch_size=32,
        validation_split=0.15,
        shuffle=False,
        callbacks=callbacks,
        verbose=1
    )

    return model, history

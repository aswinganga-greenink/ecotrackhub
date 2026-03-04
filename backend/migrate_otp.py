import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "carbontrackhub.db")

def migrate():
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create OTP verifications table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id VARCHAR PRIMARY KEY,
            email VARCHAR NOT NULL,
            otp VARCHAR NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        print("Created otp_verifications table.")
        
        # Create index on email for faster lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_otp_verifications_email ON otp_verifications (email)")
        print("Created index on email.")
        
        conn.commit()
        print("Migration complete!")
    except Exception as e:
        print(f"Error migrating: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

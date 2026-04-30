package com.jobagent.tracker.crypto;

import com.jobagent.tracker.config.TrackerProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for OAuth tokens stored in the database.
 * Key sourced from TOKEN_ENCRYPTION_KEY env var (base64-encoded 32 bytes).
 * Format of encrypted bytes: [12-byte IV][ciphertext+16-byte GCM tag].
 */
@Component
public class TokenCrypto {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LEN = 12;
    private static final int TAG_LEN = 128;

    private final byte[] key;
    private final SecureRandom rng = new SecureRandom();

    public TokenCrypto(TrackerProperties props) {
        this.key = Base64.getDecoder().decode(props.encryptionKey());
        if (this.key.length != 32) {
            throw new IllegalStateException(
                "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte (256-bit) key; got " + this.key.length + " bytes");
        }
    }

    public byte[] encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LEN];
            rng.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_LEN, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            byte[] result = new byte[IV_LEN + ciphertext.length];
            System.arraycopy(iv, 0, result, 0, IV_LEN);
            System.arraycopy(ciphertext, 0, result, IV_LEN, ciphertext.length);
            return result;
        } catch (Exception e) {
            throw new CryptoException("Encryption failed", e);
        }
    }

    public String decrypt(byte[] encrypted) {
        try {
            byte[] iv = new byte[IV_LEN];
            System.arraycopy(encrypted, 0, iv, 0, IV_LEN);
            byte[] ciphertext = new byte[encrypted.length - IV_LEN];
            System.arraycopy(encrypted, IV_LEN, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_LEN, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            throw new CryptoException("Decryption failed", e);
        }
    }

    public static class CryptoException extends RuntimeException {
        public CryptoException(String msg, Throwable cause) { super(msg, cause); }
    }
}

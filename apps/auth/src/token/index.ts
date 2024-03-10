import { Payload } from "app";
import jsonwebtoken, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { configs } from "../configs";
import sha256 from "crypto-js/sha256";

export function genAccessToken(payload: Omit<Payload, "type">): {
    token: string;
    expireAt: number;
} {
    const timestampInSec = new Date().getTime() / 1000;
    const expireAt = Math.floor(timestampInSec + 60 * 60);
    const signOptions = {
        expiresIn: "1h",
        algorithm: "RS256",
    } as SignOptions;
    const token = jsonwebtoken.sign(
        { ...payload, type: "ACCESS_TOKEN" },
        configs.keys.secret,
        signOptions
    );
    return { token, expireAt };
}

export function genRefreshToken(id: string): {
    token: string;
    expireAt: number;
} {
    const timestampInSec = new Date().getTime() / 1000;
    const expireAt = Math.floor(timestampInSec + 60 * 60);
    const signOptions = {
        expiresIn: "24h",
        algorithm: "RS256",
    } as SignOptions;
    const token = jsonwebtoken.sign(
        { id, type: "REFRESH_TOKEN" },
        configs.keys.secret,
        signOptions
    );
    return { token, expireAt };
}

export function getPayload(token: string): Payload | Error {
    const verifyOptions = {
        algorithm: "RS256",
    } as VerifyOptions;
    try {
        const publicKey = configs.keys.public;
        const payload = <Payload>(
            jsonwebtoken.verify(token, publicKey, verifyOptions)
        );
        return payload;
    } catch (error) {
        return error as Error;
    }
}

export function genResetPasswordToken(
    id: string,
    time: Date,
    password?: string
): string {
    return sha256(password || "" + id + time).toString();
}

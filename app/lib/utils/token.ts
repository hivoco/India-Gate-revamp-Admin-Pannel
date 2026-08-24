import jwt, { SignOptions } from "jsonwebtoken";

export interface UserPayload {
  id: number;
  email: string;
  role: "superadmin" | "admin";
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_REFRESH_SECRET");
  }

  return secret;
};

export const generateAccessToken = (user: UserPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
};

export const generateRefreshToken = (user: UserPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getRefreshSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE as SignOptions["expiresIn"],
    },
  );
};

export const verifyAccessToken = (token: string): UserPayload => {
  // for the checking of expiring accesstoken
  // console.log("JWT_SECRET:", process.env.JWT_SECRET);

  const payload = jwt.verify(token, getJwtSecret());

  // console.log("Payload:", payload);

  return payload as UserPayload;
};

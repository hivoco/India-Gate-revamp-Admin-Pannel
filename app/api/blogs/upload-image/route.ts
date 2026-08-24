import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { saveImage } from "@/app/lib/utils/upload";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    verifyAccessToken(authHeader.split(" ")[1]);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token.",
      },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();

    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Image file is required.",
        },
        { status: 400 },
      );
    }

    const url = await saveImage(file, "blogs");

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully.",
        data: { url },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error.",
      },
      { status: 500 },
    );
  }
}
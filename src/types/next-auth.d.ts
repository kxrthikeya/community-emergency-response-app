import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    phoneNumber?: string;
    isGuest?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      phoneNumber?: string;
      isGuest?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    phoneNumber?: string;
    isGuest?: boolean;
  }
}
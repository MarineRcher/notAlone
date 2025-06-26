import { Request, Response, NextFunction } from "express";
import { getUserAddictionLinks } from "../../../../controllers/resources/getLinkByUserAddictionController";
import AddictionUser from "../../../../models/AddictionUser";
import Addiction from "../../../../models/Addiction";
import Link from "../../../../models/Links";
import { UserAttributes } from "../../../../types/users";

jest.mock("../../../../models/AddictionUser");
jest.mock("../../../../models/Addiction");
jest.mock("../../../../models/Links");

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getUserAddictionLinks", () => {
  const next: NextFunction = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    const req = { user: null } as unknown as Request;
    const res = mockResponse();

    await getUserAddictionLinks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
  });

  it("should return grouped links for authenticated user", async () => {
    const req = { user: {
                    id: "user1",
                    login: "te1stuser",
                    email: "t1est@example.com",
                    password: "hashed_password",
                    hasPremium: false,
                    has2FA: false,
                    twoFactorSecret: null,
                    isBlocked: false,
                    notify: false,
                    hourNotify: null,
                    failedLoginAttempts: 0,
                    blockedUntil: null,
                    points: 0,
                } as UserAttributes, } as Request;
    const res = mockResponse();

    (AddictionUser.findAll as jest.Mock).mockResolvedValue([
      { id_user: "user1", id_addiction: "add1", date: new Date() },
    ]);

    (Addiction.findAll as jest.Mock).mockResolvedValue([
      { id: "add1", addiction: "Alcohol" },
    ]);

    (Link.findAll as jest.Mock).mockResolvedValue([
      {
        id_link: "link1",
        id_addiction: "add1",
        name: "Help Center",
        resume: "Support resource",
        name_link: "help-center",
        link: "http://help.com",
        image_url: null,
      },
    ]);

    await getUserAddictionLinks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        addictionId: "add1",
        addictionName: "Alcohol",
        links: [
          {
            id: "link1",
            name: "Help Center",
            resume: "Support resource",
            name_link: "help-center",
            link: "http://help.com",
            image_url: null,
          },
        ],
      },
    ]);
  });

  it("should return empty list if user has no addictions", async () => {
    const req = { user: {
				id: "user2",
				login: "test2user",
				email: "test@example2.com",
				password: "hashed_password",
				hasPremium: false,
				has2FA: false,
				twoFactorSecret: null,
				isBlocked: false,
				notify: false,
				hourNotify: null,
				failedLoginAttempts: 0,
				blockedUntil: null,
				points: 0,
			} as UserAttributes, } as Request;
    const res = mockResponse();

    (AddictionUser.findAll as jest.Mock).mockResolvedValue([]);

    await getUserAddictionLinks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("should call next with error on exception", async () => {
    const req = { user: {
				id: "user3",
				login: "testuse3r",
				email: "test@exa3mple.com",
				password: "hash3ed_password",
				hasPremium: false,
				has2FA: false,
				twoFactorSecret: null,
				isBlocked: false,
				notify: false,
				hourNotify: null,
				failedLoginAttempts: 0,
				blockedUntil: null,
				points: 0,
			} as UserAttributes, ip: "127.0.0.1" } as Request;
    const res = mockResponse();

    const error = new Error("DB failed");
    (AddictionUser.findAll as jest.Mock).mockRejectedValue(error);

    await getUserAddictionLinks(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

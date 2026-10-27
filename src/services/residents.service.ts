import { Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { ResidentsRepo } from "../repositories/residents.repository";
import { UserRepo } from "../repositories/user.repository";
import { findApartmentPublicById } from "../repositories/apartment.repository";
import { CreateResidentDTO, GetResidentsQuery, UpdateResidentDTO } from "../structs/resident.struct";
import { ResidentResponseDto } from "../models/resident.model";
import { BadRequestError, ConflictError, NotFoundError } from "../errors/errors";
import prisma from "../lib/prisma";
import { ResidentCsvRecord } from "../types/resident.type";

export class ResidentsService {
  private residentsRepo = new ResidentsRepo();
  private userRepo = new UserRepo();

  getResidents = async (queryData: GetResidentsQuery, apartmentId: string) => {
    const page = queryData.page ? Number(queryData.page) : 1;
    const limit = queryData.limit ? Number(queryData.limit) : 20;
    const take = limit;
    const skip = (page - 1) * limit;

    const where = this.residentWhereInputFromQuery(apartmentId, queryData);

    const { totalCount, count, residents } = await this.residentsRepo.findResidents(where, skip, take, apartmentId);
    const residentDtos = residents.map((resident) => new ResidentResponseDto(resident));

    return { residents: residentDtos, totalCount, count, message: "입주민 목록 조회 성공" };
  };

  createResident = async (residentData: CreateResidentDTO, apartmentId: string) => {
    const user = await this.userRepo.findByNameAndContact(residentData.name, residentData.contact, apartmentId);

    const isRegistered = !!user;

    // Prisma 에러 방지를 위해 DB에 필요한 필드만 추출
    const cleanData = {
      building: residentData.building,
      unitNumber: residentData.unitNumber,
      name: residentData.name,
      contact: residentData.contact,
      isHouseholder: residentData.isHouseholder,
      ...(residentData.residenceStatus !== undefined && { residenceStatus: residentData.residenceStatus }),
    };
    const resident = await this.residentsRepo.createResident(cleanData, apartmentId, isRegistered);

    const result = new ResidentResponseDto({ ...resident, user: user || null });
    return result;
  };

  createResidentFromUser = async (userId: string, apartmentId: string) => {
    const user = await this.residentsRepo.findUser(userId);
    if (!user) throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");
    if (user.residentId) throw new ConflictError("이미 입주민으로 등록된 사용자입니다.");

    const apartment = await findApartmentPublicById(apartmentId);
    if (!apartment) throw new NotFoundError("해당 아파트를 찾을 수 없습니다.");
    if (user.apartmentName !== apartment.name || !user.apartmentDong || !user.apartmentHo) {
      throw new NotFoundError("해당 단지의 가입 신청자를 찾을 수 없습니다.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const resident = await this.residentsRepo.createResident(
        {
          contact: user.contact,
          name: user.name,
          building: user.apartmentDong!,
          unitNumber: user.apartmentHo!,
          isHouseholder: "HOUSEHOLDER",
        },
        apartmentId,
        true,
        tx,
      );

      const updatedUser = await this.userRepo.updateUserJoinStatus(userId, "APPROVED", resident.id, tx);

      return new ResidentResponseDto({ ...resident, user: updatedUser });
    });

    return result;
  };

  // 양식 다운로드용
  generateEmptyTemplate = async () => {
    const header = `"동","호수","이름","연락처","세대주여부"\n`;

    const sample = [`"101","101","홍길동","01012345678","HOUSEHOLDER"`];

    return "\ufeff" + header + sample;
  };

  processResidentCsv = async (buffer: Buffer, apartmentId: string) => {
    const content = buffer.toString("utf-8").replace(/^\uFEFF/, "");

    const records = parse(content, {
      columns: ["building", "unitNumber", "name", "contact", "isHouseholder"],
      skip_empty_lines: true,
      from_line: 2,
    }) as ResidentCsvRecord[];

    return await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const record of records) {
        if (!record.name || !record.building || !record.unitNumber) {
          throw new BadRequestError("이름, 동, 호수는 필수 입력값입니다.");
        }

        const role = record.isHouseholder?.trim().toUpperCase();
        if (role !== "HOUSEHOLDER" && role !== "MEMBER") {
          throw new BadRequestError(`세대주여부 값이 잘못되었습니다. ('HOUSEHOLDER' 또는 'MEMBER'만 가능)`);
        }

        await this.residentsRepo.createResident(
          {
            building: String(record.building).trim(),
            unitNumber: String(record.unitNumber).trim(),
            name: record.name.trim(),
            contact: record.contact.replace(/-/g, "").trim(), // 하이픈 제거
            isHouseholder: record.isHouseholder as "HOUSEHOLDER" | "MEMBER",
          },
          apartmentId,
          false,
          tx,
        );

        count++;
      }

      return { count };
    });
  };

  downloadResidentsAsCsv = async (apartmentId: string, queryData: GetResidentsQuery) => {
    const where = this.residentWhereInputFromQuery(apartmentId, queryData);

    const page = queryData.page ? Number(queryData.page) : 1;
    const limit = queryData.limit ? Number(queryData.limit) : 10000;
    const take = limit;
    const skip = (page - 1) * limit;

    const { residents } = await this.residentsRepo.findResidents(where, skip, take, apartmentId);

    const header = `"동", "호수", "이름", "연락처", "세대주여부"\n`;
    const rows = residents
      .map((r) => {
        return [`"${r.building}"`, `"${r.unitNumber}"`, `"${r.name}"`, `"${r.contact}"`, `"${r.isHouseholder}"`].join(
          ",",
        );
      })
      .join("\n");

    return "\ufeff" + header + rows;
  };

  private residentWhereInputFromQuery = (
    apartmentId: string,
    queryData: GetResidentsQuery,
  ): Prisma.ResidentWhereInput => {
    const { building, unitNumber, residenceStatus, isRegistered, keyword, isHouseholder } = queryData;
    const where: Prisma.ResidentWhereInput = {
      apartmentId: apartmentId,
    };

    const andConditions: Prisma.ResidentWhereInput[] = [];

    if (building) andConditions.push({ building });
    if (unitNumber) andConditions.push({ unitNumber });
    if (residenceStatus) andConditions.push({ residenceStatus });
    if (isHouseholder) andConditions.push({ isHouseholder });

    if (isRegistered !== undefined) {
      if (isRegistered === "true") {
        andConditions.push({ isRegistered: true });
      } else {
        andConditions.push({ isRegistered: false });
      }
    }

    if (keyword) {
      andConditions.push({
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { contact: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  };

  getResidentById = async (residentId: string, apartmentId: string) => {
    const resident = await this.residentsRepo.getResidentById(residentId, apartmentId);
    if (!resident) {
      throw new NotFoundError("해당 입주민을 찾을 수 없습니다.");
    }

    const result = new ResidentResponseDto(resident);
    return result;
  };

  updateResident = async (residentId: string, apartmentId: string, updateData: UpdateResidentDTO) => {
    const { building, unitNumber, contact, name, isHouseholder } = updateData;

    const dataToUpdate: Prisma.ResidentUpdateInput = {};

    const addIfValid = (key: keyof Prisma.ResidentUpdateInput, value: string | undefined) => {
      if (value !== undefined) {
        const trimmed = value.trim();
        if (trimmed !== "") {
          dataToUpdate[key] = trimmed;
        }
      }
    };

    addIfValid("name", name);
    addIfValid("building", building);
    addIfValid("unitNumber", unitNumber);

    if (contact !== undefined && contact.trim() !== "") {
      dataToUpdate.contact = contact.trim();
    }

    if (isHouseholder !== undefined) {
      dataToUpdate.isHouseholder = isHouseholder;
    }

    const shouldUpdateUser = !!(
      dataToUpdate.building ||
      dataToUpdate.unitNumber ||
      dataToUpdate.name ||
      dataToUpdate.contact
    );

    return await prisma.$transaction(async (tx) => {
      const updatedResident = await this.residentsRepo.updateResident(residentId, apartmentId, dataToUpdate, tx);

      if (shouldUpdateUser && updatedResident.user?.id) {
        const updateUserData: Prisma.UserUpdateInput = {};
        if (dataToUpdate.name) updateUserData.name = dataToUpdate.name;
        if (dataToUpdate.contact) updateUserData.contact = dataToUpdate.contact;
        if (dataToUpdate.building) updateUserData.apartmentDong = dataToUpdate.building;
        if (dataToUpdate.unitNumber) updateUserData.apartmentHo = dataToUpdate.unitNumber;

        await this.userRepo.updateUser(updatedResident.user.id, updateUserData, tx);
      }

      return new ResidentResponseDto(updatedResident);
    });
  };

  deleteResident = async (residentId: string, apartmentId: string) => {
    const resident = await this.residentsRepo.getResidentById(residentId, apartmentId);
    if (!resident) throw new NotFoundError("해당 입주민을 찾을 수 없습니다.");

    return await prisma.$transaction(async (tx) => {
      if (resident.user) {
        await this.userRepo.revokeUserAccess(resident.user.id, tx);
      }

      await this.residentsRepo.deleteResident(residentId, apartmentId, tx);
    });
  };
}

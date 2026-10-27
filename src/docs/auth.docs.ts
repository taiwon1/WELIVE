const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "uuid-v4-string" },
    username: { type: "string", example: "user_test" },
    name: { type: "string", example: "홍길동" },
    email: { type: "string", example: "test@example.com" },
    contact: { type: "string", example: "01012345678" },
    role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "USER"], example: "USER" },
    joinStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" },
    isActive: { type: "boolean", example: true },
  },
};

const messageSchema = {
  type: "object",
  properties: { message: { type: "string", example: "작업이 성공적으로 완료되었습니다." } },
};

export const authDocs = {
  "/api/auth/signup": {
    post: {
      tags: ["Auth"],
      summary: "입주민 회원가입",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                password: { type: "string" },
                contact: { type: "string", example: "01012345678" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string", enum: ["USER"] },
                apartmentName: { type: "string" },
                apartmentDong: { type: "string" },
                apartmentHo: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "회원가입 성공",
          content: { "application/json": { schema: userResponseSchema } },
        },
      },
    },
  },
  "/api/auth/signup/admin": {
    post: {
      tags: ["Auth"],
      summary: "관리자 회원가입",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                password: { type: "string" },
                passwordConfirm: { type: "string" },
                contact: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string", enum: ["ADMIN"] },
                description: { type: "string" },
                startComplexNumber: { type: "string" },
                endComplexNumber: { type: "string" },
                startDongNumber: { type: "string" },
                endDongNumber: { type: "string" },
                startFloorNumber: { type: "string" },
                endFloorNumber: { type: "string" },
                startHoNumber: { type: "string" },
                endHoNumber: { type: "string" },
                apartmentName: { type: "string" },
                apartmentAddress: { type: "string" },
                apartmentManagementNumber: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "관리자 회원가입 성공",
          content: { "application/json": { schema: userResponseSchema } },
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "로그인",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "로그인 성공 및 쿠키 발급",
          content: { "application/json": { schema: userResponseSchema } },
        },
      },
    },
  },
  "/api/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "토큰 갱신",
      responses: {
        200: {
          description: "토큰 갱신 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
  "/api/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "로그아웃",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "로그아웃 성공 및 쿠키 삭제",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
  "/api/auth/cleanup": {
    post: {
      tags: ["Auth"],
      summary: "가입 거절된 계정 정리",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "정리 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
  "/api/auth/admins/{adminId}/status": {
    patch: {
      tags: ["Auth"],
      summary: "[슈퍼관리자] 특정 관리자 승인 상태 변경",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", properties: { status: { type: "string", enum: ["APPROVED", "REJECTED"] } } },
          },
        },
      },
      responses: {
        200: {
          description: "상태 변경 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
  "/api/auth/admins/status": {
    patch: {
      tags: ["Auth"],
      summary: "[슈퍼관리자] 관리자 일괄 승인 상태 변경",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", properties: { status: { type: "string", enum: ["APPROVED", "REJECTED"] } } },
          },
        },
      },
      responses: {
        200: {
          description: "일괄 변경 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
  "/api/auth/admins/{adminId}": {
    patch: {
      tags: ["Auth"],
      summary: "[슈퍼관리자] 관리자 및 아파트 정보 수정",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { contact: { type: "string" }, name: { type: "string" }, apartmentName: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "정보 수정 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
    delete: {
      tags: ["Auth"],
      summary: "[슈퍼관리자] 특정 관리자 삭제",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
      responses: { 204: { description: "삭제 성공" } },
    },
  },
  "/api/auth/residents/{residentId}/status": {
    patch: {
      tags: ["Auth"],
      summary: "[관리자] 특정 입주민 승인 상태 변경",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "residentId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", properties: { status: { type: "string", enum: ["APPROVED", "REJECTED"] } } },
          },
        },
      },
      responses: {
        200: {
          description: "상태 변경 성공",
          content: { "application/json": { schema: messageSchema } },
        },
      },
    },
  },
};

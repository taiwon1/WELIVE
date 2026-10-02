const security = [{ bearerAuth: [] }];
const incidentParam = { name: 'incidentId', in: 'path', required: true, schema: { type: 'string' } };
const pages = ['page', 'limit'].map(name => ({ name, in: 'query', schema: { type: 'integer', minimum: 1, maximum: name === 'limit' ? 100 : 100000 } }));
const complaintIds = { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { type: 'string' } };
const body = (properties: object, required: string[]) => ({ required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false, properties, required } } } });
const errors = {
  '400': { description: '입력/상태 전이 오류' }, '401': { description: '미인증' },
  '403': { description: '현재 DB 역할/승인/거주 권한 없음' },
  '404': { description: '존재하지 않거나 접근할 수 없는 자원' },
  '409': { description: '다른 문제에 연결됨, 버전 충돌 또는 requestId 재사용 오류' },
};
const operation = (summary: string, extra: object = {}) => ({ tags: ['Incidents'], security, summary, responses: { '200': { description: '성공' }, ...errors }, ...extra });
export const incidentDocs = {
  '/api/incidents': {
    get: operation('관리자는 단지 내 문제, 주민은 자신의 민원이 연결된 문제만 조회', { parameters: pages }),
    post: operation('담당 관리자가 공동 문제 생성 및 민원 연결', {
      requestBody: body({ title: { type: 'string', maxLength: 150 }, description: { type: 'string', maxLength: 5000 }, complaintIds }, ['title', 'description', 'complaintIds']),
      responses: { '201': { description: '공동 문제 생성, 초기 version=0' }, ...errors },
    }),
  },
  '/api/incidents/{incidentId}': { get: operation('공동 문제 및 최근 20개 이력, 허용된 민원 ID 조회', { parameters: [incidentParam] }) },
  '/api/incidents/{incidentId}/complaints': {
    post: operation('같은 단지 민원을 일괄 연결 (반복 요청 안전)', { parameters: [incidentParam], requestBody: body({ complaintIds }, ['complaintIds']) }),
  },
  '/api/incidents/{incidentId}/complaints/{complaintId}': {
    delete: operation('민원 연결 해제 (원본 보존)', {
      parameters: [incidentParam, { name: 'complaintId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '204': { description: '해제 완료, 이미 해제된 연결에도 동일 응답' }, ...errors },
    }),
  },
  '/api/incidents/{incidentId}/updates': {
    get: operation('주민에게 공개되는 처리 이력 페이지 조회', { parameters: [incidentParam, ...pages] }),
    post: operation('관리자 처리 이력·상태 변경 및 작성자별 알림 저장', {
      parameters: [incidentParam],
      description: '동일 제출의 재시도는 같은 requestId/본문을 사용합니다. expectedVersion은 조회한 version이며 동일 요청 재전송은 원래 updateId/version을 반환합니다. 자세한 정책은 docs/incidents.md 참고.',
      requestBody: body({
        requestId: { type: 'string', pattern: '^[a-zA-Z0-9_-]{8,100}$' },
        expectedVersion: { type: 'integer', minimum: 0 }, content: { type: 'string', maxLength: 5000 },
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'] },
        expectedResolutionAt: { type: 'string', format: 'date-time', nullable: true },
      }, ['requestId', 'expectedVersion', 'content', 'status', 'expectedResolutionAt']),
    }),
  },
};

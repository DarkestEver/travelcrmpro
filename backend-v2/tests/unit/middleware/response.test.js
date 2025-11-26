const attachResponseHelpers = require('../../../src/middleware/response');

describe('Response Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = { id: 'test-request-123' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });
  
  test('should attach response helpers to res object', () => {
    attachResponseHelpers(req, res, next);
    
    expect(res.ok).toBeDefined();
    expect(res.created).toBeDefined();
    expect(res.noContent).toBeDefined();
    expect(res.fail).toBeDefined();
    expect(typeof res.ok).toBe('function');
    expect(next).toHaveBeenCalled();
  });
  
  test('res.ok should return success response with data', () => {
    attachResponseHelpers(req, res, next);
    
    res.ok({ user: 'John Doe' });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: 'John Doe' },
      traceId: 'test-request-123',
    });
  });
  
  test('res.ok should include meta when provided', () => {
    attachResponseHelpers(req, res, next);
    
    res.ok({ users: [] }, { page: 1, total: 0 });
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { users: [] },
      meta: { page: 1, total: 0 },
      traceId: 'test-request-123',
    });
  });
  
  test('res.created should return 201 status', () => {
    attachResponseHelpers(req, res, next);
    
    res.created({ id: '123' });
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: '123' },
      traceId: 'test-request-123',
    });
  });
  
  test('res.noContent should return 204 with no body', () => {
    attachResponseHelpers(req, res, next);
    
    res.noContent();
    
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
  
  test('res.fail should return error response', () => {
    attachResponseHelpers(req, res, next);
    
    res.fail(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' }, 'ValidationError');
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
        type: 'ValidationError',
      },
      traceId: 'test-request-123',
    });
  });
  
  test('res.fail should work without details', () => {
    attachResponseHelpers(req, res, next);
    
    res.fail(404, 'NOT_FOUND', 'Resource not found', null, 'NotFoundError');
    
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        type: 'NotFoundError',
      },
      traceId: 'test-request-123',
    });
  });
});

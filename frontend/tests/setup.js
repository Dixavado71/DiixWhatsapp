// Setup file for frontend tests
import { config } from '@vue/test-utils'

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

global.localStorage = localStorageMock

// Mock do window.location
const locationMock = {
  href: '',
  assign: jest.fn(),
  reload: jest.fn(),
}

Object.defineProperty(global, 'window', {
  value: {
    location: locationMock,
    localStorage: localStorageMock,
  },
  writable: true,
})

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
})

// Configurar Vue Test Utils
config.global.mocks = {
  $router: {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    currentRoute: { value: {} },
  },
  $route: {
    params: {},
    query: {},
    name: '',
    path: '/',
    fullQuery: {},
    matched: [],
  },
}

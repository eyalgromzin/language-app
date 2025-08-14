"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LIBRARY_JSON_PATH = path.join(process.cwd(), 'src', 'library', 'library.json');
let LibraryService = class LibraryService {
    loadLibrary() {
        if (!fs.existsSync(LIBRARY_JSON_PATH)) {
            throw new common_1.BadRequestException('library.json not found');
        }
        const raw = fs.readFileSync(LIBRARY_JSON_PATH, 'utf8');
        return JSON.parse(raw);
    }
    saveLibrary(data) {
        fs.writeFileSync(LIBRARY_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    }
    getUrlsByLanguage(language) {
        const data = this.loadLibrary();
        return data.library
            .filter((item) => item.language.toLowerCase() === language.toLowerCase())
            .map((item) => item.url);
    }
    getUrlsWithCriteria(language, level, type) {
        const data = this.loadLibrary();
        const typeId = this.resolveTypeId(data, type);
        return data.library
            .filter((item) => item.language.toLowerCase() === language.toLowerCase() &&
            item.level.toLowerCase() === level.toLowerCase() &&
            item.typeId === typeId)
            .map((item) => item.url);
    }
    addUrl(url, language, level, type, name) {
        if (!url || !language || !level || (type === undefined || type === null)) {
            throw new common_1.BadRequestException('Missing required fields: url, language, level, type');
        }
        const data = this.loadLibrary();
        const typeId = this.resolveTypeId(data, type);
        const newItem = {
            url,
            name: name ?? url,
            language,
            typeId,
            level,
        };
        data.library.push(newItem);
        this.saveLibrary(data);
        return newItem;
    }
    resolveTypeId(data, type) {
        if (typeof type === 'number' && Number.isFinite(type)) {
            return type;
        }
        const typeName = String(type).toLowerCase();
        const match = data.itemTypes.find((t) => t.name.toLowerCase() === typeName);
        if (!match) {
            throw new common_1.BadRequestException(`Unknown type: ${type}`);
        }
        return match.id;
    }
};
exports.LibraryService = LibraryService;
exports.LibraryService = LibraryService = __decorate([
    (0, common_1.Injectable)()
], LibraryService);
//# sourceMappingURL=library.service.js.map
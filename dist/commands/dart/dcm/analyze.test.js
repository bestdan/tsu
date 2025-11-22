import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartDcmAnalyze } from './analyze.js';
import * as commandHelpers from '../../../utils/command-helpers.js';
import * as dartUtils from '../utils/dart.js';
import * as dcmParse from '../../../utils/dcm-parse.js';
vi.mock('../../../utils/command-helpers.js', async () => {
    const actual = await vi.importActual('../../../utils/command-helpers.js');
    return {
        ...actual,
        ensureDCMInstalled: vi.fn(),
        ensureCondition: vi.fn(),
    };
});
vi.mock('../utils/dart.js', async () => {
    const actual = await vi.importActual('../utils/dart.js');
    return {
        ...actual,
        isDartPackage: vi.fn(),
    };
});
vi.mock('../../../utils/dcm-parse.js', async () => {
    const actual = await vi.importActual('../../../utils/dcm-parse.js');
    return {
        ...actual,
        dcmAnalyze: vi.fn(),
    };
});
describe('dartDcmAnalyze', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
    const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(commandHelpers.ensureDCMInstalled).mockReturnValue(undefined);
        vi.mocked(commandHelpers.ensureCondition).mockReturnValue(undefined);
        vi.mocked(dartUtils.isDartPackage).mockReturnValue(true);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    it('should exit successfully when DCM finds no issues', () => {
        vi.mocked(dcmParse.dcmAnalyze).mockReturnValue({
            success: true,
            filesWithIssues: [],
        });
        dartDcmAnalyze({ verbose: false });
        expect(commandHelpers.ensureDCMInstalled).toHaveBeenCalledWith(false);
        expect(commandHelpers.ensureCondition).toHaveBeenCalledWith(true, 'Error: Not in a Dart package');
        expect(dcmParse.dcmAnalyze).toHaveBeenCalledWith({
            cwd: expect.any(String),
            timeout: 7000,
        });
        expect(mockExit).toHaveBeenCalledWith(0);
    });
    it('should output files and exit with error when DCM finds issues', () => {
        vi.mocked(dcmParse.dcmAnalyze).mockReturnValue({
            success: false,
            filesWithIssues: ['lib/file1.dart', 'lib/file2.dart'],
        });
        dartDcmAnalyze({ verbose: false });
        expect(mockConsoleLog).toHaveBeenCalledWith('lib/file1.dart');
        expect(mockConsoleLog).toHaveBeenCalledWith('lib/file2.dart');
        expect(mockExit).toHaveBeenCalledWith(1);
    });
    it('should use custom timeout when provided', () => {
        vi.mocked(dcmParse.dcmAnalyze).mockReturnValue({
            success: true,
            filesWithIssues: [],
        });
        dartDcmAnalyze({ verbose: false, timeout: 10000 });
        expect(dcmParse.dcmAnalyze).toHaveBeenCalledWith({
            cwd: expect.any(String),
            timeout: 10000,
        });
    });
    it('should handle verbose mode', () => {
        vi.mocked(dcmParse.dcmAnalyze).mockReturnValue({
            success: true,
            filesWithIssues: [],
        });
        dartDcmAnalyze({ verbose: true });
        expect(commandHelpers.ensureDCMInstalled).toHaveBeenCalledWith(true);
        expect(mockExit).toHaveBeenCalledWith(0);
    });
    it('should exit with error when no files have issues', () => {
        vi.mocked(dcmParse.dcmAnalyze).mockReturnValue({
            success: false,
            filesWithIssues: [],
        });
        dartDcmAnalyze({ verbose: false });
        expect(mockConsoleLog).not.toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});

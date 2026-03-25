import { inflateRawSync } from "node:zlib";

interface ZipEntryRecord {
	name: string;
	compressionMethod: number;
	compressedSize: number;
	localHeaderOffset: number;
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const findEndOfCentralDirectory = (buffer: Buffer) => {
	for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset--) {
		if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
			return offset;
		}
	}

	return -1;
};

const parseCentralDirectory = (buffer: Buffer): ZipEntryRecord[] => {
	const endOffset = findEndOfCentralDirectory(buffer);
	if (endOffset < 0) {
		throw new Error("ZIP central directory not found");
	}

	const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
	const totalEntries = buffer.readUInt16LE(endOffset + 10);
	const entries: ZipEntryRecord[] = [];
	let offset = centralDirectoryOffset;

	for (let index = 0; index < totalEntries; index++) {
		if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
			throw new Error("Invalid ZIP central directory entry");
		}

		const compressionMethod = buffer.readUInt16LE(offset + 10);
		const compressedSize = buffer.readUInt32LE(offset + 20);
		const fileNameLength = buffer.readUInt16LE(offset + 28);
		const extraLength = buffer.readUInt16LE(offset + 30);
		const commentLength = buffer.readUInt16LE(offset + 32);
		const localHeaderOffset = buffer.readUInt32LE(offset + 42);
		const name = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

		entries.push({
			name,
			compressionMethod,
			compressedSize,
			localHeaderOffset,
		});

		offset += 46 + fileNameLength + extraLength + commentLength;
	}

	return entries;
};

const readEntryData = (buffer: Buffer, entry: ZipEntryRecord): Buffer => {
	const localOffset = entry.localHeaderOffset;
	if (buffer.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
		throw new Error(`Invalid ZIP local header for ${entry.name}`);
	}

	const fileNameLength = buffer.readUInt16LE(localOffset + 26);
	const extraLength = buffer.readUInt16LE(localOffset + 28);
	const dataStart = localOffset + 30 + fileNameLength + extraLength;
	const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);

	if (entry.compressionMethod === 0) {
		return compressedData;
	}

	if (entry.compressionMethod === 8) {
		return inflateRawSync(compressedData);
	}

	throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}`);
};

export function readZipEntries(buffer: Buffer): Map<string, Buffer> {
	const entries = parseCentralDirectory(buffer);
	const result = new Map<string, Buffer>();

	for (const entry of entries) {
		result.set(entry.name, readEntryData(buffer, entry));
	}

	return result;
}

// queue init: scan all files for an id, invalidate duplicates
// invalid / unset files are sorted by modified date -> filename tiebreaker
export class NoteQueue {
	constructor(
		private q: QueueFile[] = []
	) {
	}

	public next(): QueueFile | undefined {
		return this.q.at(0);
	}

}

interface QueueFile {

}

export function parseFiles(): NoteQueue {
	const noteQueue = new NoteQueue();


	return noteQueue;
}

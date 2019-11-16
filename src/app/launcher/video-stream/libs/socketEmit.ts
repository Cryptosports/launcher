export function emit<T>(
	socket: SocketIOClient.Socket,
	event: string,
	args: any,
): Promise<T> {
	return new Promise(resolve => {
		socket.emit(event, args, (data: T) => {
			resolve(data);
		});
	});
}

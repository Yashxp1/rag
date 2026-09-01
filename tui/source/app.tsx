import React from 'react';
import {Text} from 'ink';

interface nameProp {
	name: string | undefined;
}

export default function App({name = 'Yash'}: nameProp) {
	const hour = new Date().getHours();
	const greet =
		hour < 12 ? 'Good Morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

	return (
		<Text>
			<Text color="green">{greet}</Text> <Text color="red">{name}</Text>
		</Text>
	);
}

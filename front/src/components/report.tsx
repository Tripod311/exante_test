import { useParams } from "react-router-dom"

export default function Report () {
	const { chatId } = useParams();

	return <h1>Report { chatId }</h1>
}
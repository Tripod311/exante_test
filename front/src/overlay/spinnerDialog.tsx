import Spinner from "../components/spinner.jsx"

export default function SpinnerDialog () {
	return <div className="w-[80%] h-[80%] rounded-2xl border border-gray-200 bg-white shadow-2xl z-20 overflow-hidden">
		<Spinner />
	</div>
}
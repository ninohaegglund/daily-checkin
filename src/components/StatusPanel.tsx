import { useHealthStore } from "../store/healthStore";

export default function StatusPanel() {
  const { statuses } = useHealthStore();

  if (!statuses || statuses.length === 0) return null;

  return (
    <div className="mt-8 w-full max-w-xl grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-1">
      {statuses.map((status) => (
        <div
          key={status.id}
          className={`relative p-6 rounded-xl shadow-2xl border-2 transform hover:scale-105 transition-all duration-200
            ${status.severity === "warning" ? "bg-red-800 border-red-600" : "bg-green-800 border-green-600"}
          `}
        >
         {/* Status Label */}
        <div className="flex items-center mb-2">
          <span className="relative flex w-3 h-3 mr-2">
            {/* Ping layer */}
            <span
              className={`absolute inline-flex h-full w-full rounded-full animate-ping opacity-75 ${
                status.severity === "warning" ? "bg-red-400" : "bg-green-400"
              }`}
            />

            {/* Static core dot */}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                status.severity === "warning" ? "bg-red-500" : "bg-green-500"
              }`}
            />
          </span>

          <h3 className="text-xl font-bold text-white">{status.label}</h3>
        </div>

          {/* Description */}
          <p className="text-gray-200">{status.description}</p>

          {/* Advice */}
          <p className="mt-2 text-gray-100 font-semibold">Advice: {status.advice}</p>
        </div>
      ))}
    </div>
  );
}

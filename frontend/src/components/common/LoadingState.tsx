import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden animate-pulse border border-outline-variant/30">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low h-10 border-b border-outline-variant/20">
              <th className="w-10 px-4">
                <div className="w-4 h-4 bg-surface-container-high rounded mx-auto" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-20 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-24 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-28 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-24 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-20 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="px-space-md py-2">
                <div className="w-16 h-3 bg-surface-container-high rounded" />
              </th>
              <th className="w-12 px-space-md py-2">
                <div className="w-4 h-4 bg-surface-container-high rounded ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="h-14">
                <td className="w-10 px-4">
                  <div className="w-4 h-4 bg-surface-container rounded mx-auto" />
                </td>
                <td className="px-space-md">
                  <div className="w-24 h-4 bg-surface-container rounded" />
                </td>
                <td className="px-space-md">
                  <div className="w-28 h-4 bg-surface-container rounded" />
                </td>
                <td className="px-space-md">
                  <div className="w-36 h-4 bg-surface-container rounded" />
                </td>
                <td className="px-space-md">
                  <div className="w-32 h-4 bg-surface-container rounded" />
                </td>
                <td className="px-space-md">
                  <div className="w-20 h-4 bg-surface-container rounded" />
                </td>
                <td className="px-space-md">
                  <div className="w-20 h-6 bg-surface-container rounded-full" />
                </td>
                <td className="px-space-md">
                  <div className="w-5 h-5 bg-surface-container rounded-full ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-12 bg-surface-container-low flex items-center justify-between px-space-md">
        <div className="w-48 h-4 bg-surface-container rounded" />
        <div className="w-40 h-6 bg-surface-container rounded" />
      </div>
    </div>
  );
};

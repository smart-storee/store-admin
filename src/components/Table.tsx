import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export const Table = ({ headers, children, className = '' }: TableProps) => {
  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index} 
                scope="col" 
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps {
  children: ReactNode;
}

export const TableRow = ({ children }: TableRowProps) => {
  return (
    <tr>
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export const TableCell = ({ children, className = '' }: TableCellProps) => {
  return (
    <td className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6 ${className}`}>
      {children}
    </td>
  );
};
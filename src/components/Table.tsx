import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export const Table = ({ headers, children, className = '' }: TableProps) => {
  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  scope="col" 
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {children}
          </tbody>
        </table>
      </div>
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
    <td className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 dark:text-gray-300 sm:pl-6 ${className}`}>
      {children}
    </td>
  );
};
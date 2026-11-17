import re

with open('src/pages/admin/BulkImport.tsx', 'r') as f:
    code = f.read()

badge_old = """
                        <td className="px-4 py-3">
                           {row.duplicateStatus !== 'new' ? <span className="text-amber-500 text-xs">Duplicate</span> : '-'}
                        </td>
"""

badge_new = """
                        <td className="px-4 py-3">
                           {row.duplicateStatus === 'duplicate_offer' && <span className="text-amber-500 text-xs font-bold">Duplicate</span>}
                           {row.duplicateStatus === 'duplicate_product' && <span className="text-blue-500 text-xs font-bold">Add Offer</span>}
                           {row.duplicateStatus === 'new' && <span className="text-emerald-500 text-xs font-bold">New</span>}
                        </td>
"""

code = code.replace(badge_old.strip(), badge_new.strip())

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(code)

print("done patching badges")

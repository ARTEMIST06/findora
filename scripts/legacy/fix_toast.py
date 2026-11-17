import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

code = code.replace("showToast(`Updated \"${editingProduct.name}\"`, 'success');", "")
code = code.replace("showToast(`Added new product \"${editingProduct.name}\"`, 'success');", "")

replacement = """
      setIsProductModalOpen(false);
      showToast(editingProduct.id ? `Updated "${editingProduct.name}" and its offers` : `Added new product "${editingProduct.name}" and its offers`, 'success');
    } catch (err: any) {
"""

code = code.replace("""      setIsProductModalOpen(false);\n    } catch (err: any) {""", replacement)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)
print("done")

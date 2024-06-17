import sys
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QGridLayout, QInputDialog, QColorDialog, QTextEdit
from PyQt5.QtGui import QColor
import random

class CSSGridGenerator(QWidget):
    def __init__(self):
        super().__init__()

        self.initUI()

    def initUI(self):
        self.setGeometry(300, 300, 400, 300)
        self.setWindowTitle('CSS Grid Generator')

        layout = QVBoxLayout()
        self.setLayout(layout)

        grid_button = QPushButton('Generate Grid')
        grid_button.clicked.connect(self.generateGrid)
        layout.addWidget(grid_button)

        palette_button = QPushButton('Generate Color Palette')
        palette_button.clicked.connect(self.generatePalette)
        layout.addWidget(palette_button)

        self.code_edit = QTextEdit()
        layout.addWidget(self.code_edit)

        self.show()

    def generateGrid(self):
        rows, ok = QInputDialog.getInteger(self, 'Grid Rows', 'Enter number of rows:', 1, 1, 10)
        cols, ok = QInputDialog.getInteger(self, 'Grid Columns', 'Enter number of columns:', 1, 1, 10)

        if ok:
            grid_code = ''
            for i in range(rows):
                for j in range(cols):
                    grid_code += f'grid-column: {j+1}; grid-row: {i+1};\n'

            self.code_edit.setText(f'grid-template-columns: repeat({cols}, 1fr);\ngrid-template-rows: repeat({rows}, 1fr);\n\n{grid_code}')

            palette_size, ok = QInputDialog.getInteger(self, 'Color Palette Size', 'Enter number of colors:', 1, 1, 10)
            if ok:
                self.generatePalette(palette_size)

    def generatePalette(self, size=5):
        colors = []
        for _ in range(size):
            r, g, b = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
            colors.append(QColor(r, g, b))

        palette_code = ''
        for i, color in enumerate(colors):
            palette_code += f'Color {i+1}:\n'
            palette_code += f'Hex: #{color.rgb() & 0xffffff:06x}\n'
            palette_code += f'RGB: rgb({color.red()}, {color.green()}, {color.blue()})\n'
            palette_code += f'RGBA: rgba({color.red()}, {color.green()}, {color.blue()}, {color.alpha() / 255})\n\n'

        self.code_edit.setText(self.code_edit.toPlainText() + '\n' + palette_code)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    generator = CSSGridGenerator()
    sys.exit(app.exec_())

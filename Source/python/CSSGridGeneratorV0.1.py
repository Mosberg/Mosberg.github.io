import sys
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QGridLayout, QLineEdit, QComboBox
from PyQt5.QtGui import QColor
import random

class CSSGridGenerator(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        self.setGeometry(300, 300, 400, 300)
        self.setWindowTitle('CSS Grid Generator')

        layout = QVBoxLayout()
        self.setLayout(layout)

        self.create_grid_group(layout)
        self.create_palette_group(layout)
        self.create_generate_button(layout)
        self.create_code_edit(layout)

        self.show()

    def create_grid_group(self, layout):
        grid_group = QWidget()
        layout.addWidget(grid_group)
        grid_layout = QGridLayout()
        grid_group.setLayout(grid_layout)

        self.rows_edit = self.create_input_field(grid_layout, 'Rows:', 0, 0)
        self.cols_edit = self.create_input_field(grid_layout, 'Columns:', 1, 0)
        self.gap_edit = self.create_input_field(grid_layout, 'Gap:', 2, 0)

    def create_input_field(self, layout, label_text, row, col):
        label = QLabel(label_text)
        layout.addWidget(label, row, col)
        input_field = QLineEdit()
        layout.addWidget(input_field, row, col + 1)
        return input_field

    def create_palette_group(self, layout):
        palette_group = QWidget()
        layout.addWidget(palette_group)
        palette_layout = QGridLayout()
        palette_group.setLayout(palette_layout)

        self.palette_size_edit = self.create_input_field(palette_layout, 'Palette Size:', 0, 0)
        self.palette_type_combo = self.create_combo_box(palette_layout, 'Palette Type:', 1, 0)

    def create_combo_box(self, layout, label_text, row, col):
        label = QLabel(label_text)
        layout.addWidget(label, row, col)
        combo_box = QComboBox()
        combo_box.addItems(['Random', 'Monochromatic', 'Complementary'])
        layout.addWidget(combo_box, row, col + 1)
        return combo_box

    def create_generate_button(self, layout):
        generate_button = QPushButton('Generate Grid and Palette')
        generate_button.clicked.connect(self.generate_grid_and_palette)
        layout.addWidget(generate_button)

    def create_code_edit(self, layout):
        self.code_edit = QTextEdit()
        layout.addWidget(self.code_edit)

    def generate_grid_and_palette(self):
        rows = int(self.rows_edit.text())
        cols = int(self.cols_edit.text())
        gap = int(self.gap_edit.text())
        palette_size = int(self.palette_size_edit.text())
        palette_type = self.palette_type_combo.currentText()

        grid_code = self.generate_grid_code(rows, cols, gap)
        palette_code = self.generate_palette_code(palette_size, palette_type)

        self.code_edit.setText(f'grid-template-columns: repeat({cols}, 1fr);\ngrid-template-rows: repeat({rows}, 1fr);\ngrid-gap: {gap}px;\n\n{grid_code}\n\n{palette_code}')

    def generate_grid_code(self, rows, cols, gap):
        grid_code = ''
        for i in range(rows):
            for j in range(cols):
                grid_code += f'grid-column: {j+1}; grid-row: {i+1};\n'
        return grid_code

    def generate_palette_code(self, palette_size, palette_type):
        if palette_type == 'Random':
            colors = [QColor(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)) for _ in range(palette_size)]
        elif palette_type == 'Monochromatic':
            base_color = QColor(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
            colors = [base_color.darker(100 + i * 10) for i in range(palette_size)]
        elif palette_type == 'Complementary':
            base_color = QColor(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
            colors = [base_color, base_color.complementaryColor()]

        palette_code = ''
        for i, color in enumerate(colors):
            palette_code += f'Color {i+1}:\n'
            palette_code += f'Hex: #{color.rgb() & 0xffffff:06x}\n'
            palette_code += f'RGB: rgb({color.red()}, {color.green()}, {color.blue()})\n'
            palette_code += f'RGBA: rgba({color.red()}, {color.green()}, {color.blue()}, {color.alpha() / 255})\n\n'
        return palette_code

if __name__ == '__main__':
    app = QApplication(sys.argv)
    generator = CSSGridGenerator()
    sys.exit(app.exec_())

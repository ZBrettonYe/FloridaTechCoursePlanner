import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prerequisiteHighlight'
})
export class PrerequisiteHighlightPipe implements PipeTransform {
  private readonly GRADE_REQUIREMENT = /(Undergraduate|Graduate) level [A-Z]{3,4} \d{4}( Minimum Grade of [A-Z])?/g;
  private readonly COURSE = /([A-Z]{3,4} \d{4})/g;
  private readonly AND = /\s(and)\s/g;
  private readonly OR = /\s(or)\s/g;

  private readonly parenthesisRegex = /(\(|\))/g;
  private parenthesisLevel = -1;

  private readonly cache = new Map<string, string>();

  /**
   * Analyze and insert HTML tags into the string.
   * @param value - Raw string to be highlighted.
   * @param doTransform - If do actual highlight. Otherwise the original string is returned.
   * @param _args Unused.
   * @returns HTML statements. The return value should go into an HTML element's 'innerHTML' value.
   */
  transform(value: string, doTransform = true, ..._args: any[]): string {
    // See if skip transform
    if (!doTransform) {
      return value;
    }

    // see if there's already a cache
    if (this.cache.has(value)) {
      return this.cache.get(value) ?? '';
    }

    // Do transform
    let transformedValue = value.replace(
      this.GRADE_REQUIREMENT,
      '<span class="grade-requirement">$&</span>'
    ).replace(
      this.COURSE,
      '<span class="course">$&</span>'
    ).replace(
      this.AND,
      '<span class="boolean and">$&</span>'
    ).replace(
      this.OR,
      '<span class="boolean or">$&</span>'
    ).replace(
      this.parenthesisRegex,
      this.transformParenthesis.bind(this)
    );

    // Put a span around the actual content so that CSS works
    transformedValue = `<span class="prerequisite">${transformedValue}</span>`;

    // Cache the result
    this.cache.set(value, transformedValue);

    return transformedValue;
  }

  /**
   * Color the parenthesis based on its nesting level.
   * @param match - A single char of left or right parenthesis.
   * @returns HTML statement.
   */
  transformParenthesis(match: string): string {
    if (match === '(') {
      this.parenthesisLevel++;
      const l = this.parenthesisLevel % 3;
      return `<span class="parenthesis-${l}">${match}</span>`;
    } else {
      this.parenthesisLevel--;
      const l = (this.parenthesisLevel + 1) % 3;
      return `<span class="parenthesis-${l}">${match}</span>`;
    }
  }
}

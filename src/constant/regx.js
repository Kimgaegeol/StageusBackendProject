const idRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,20}$/;
const pwRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,20}$/;
const nameRegex = /^[가-힣a-zA-Z].{1,20}$/;
const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
const nonNegativeNumberRegex = /^(0|[1-9]\d*)$/;
const textMax50 = /^.{1,50}$/;
const textMax1000 = /^.{1,1000}$/;

module.exports = {idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex, textMax50, textMax1000};
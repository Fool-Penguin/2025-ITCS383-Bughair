# Before Change
## Overall
<img width="1696" height="709" alt="image" src="https://github.com/user-attachments/assets/44126c71-6832-4de2-a026-71af0313d904" />
<img width="1696" height="663" alt="image" src="https://github.com/user-attachments/assets/caabdab8-ec27-4ee8-85df-b6d2f5ca4b06" />
<img width="1695" height="341" alt="image" src="https://github.com/user-attachments/assets/2ee4cb61-9b55-40ee-a74f-814b680fe5f8" />
<img width="1696" height="598" alt="image" src="https://github.com/user-attachments/assets/1aa3a351-120d-483e-88e7-4d2ab4d53044" />

## Issues
<img width="1697" height="478" alt="image" src="https://github.com/user-attachments/assets/536ab856-6f75-4593-8a0d-b748047f7537" />
<img width="1696" height="881" alt="image" src="https://github.com/user-attachments/assets/89bc834c-fd19-4362-9d94-d071edc33789" />

# After Change
## Overall
<img width="1728" height="826" alt="image" src="https://github.com/user-attachments/assets/452d7568-5e9e-4bc3-8903-d17ef0a0c7ff" />
<img width="1728" height="700" alt="image" src="https://github.com/user-attachments/assets/c11cf707-7c71-49f0-b63a-cd02026f4b24" />
<img width="1729" height="441" alt="image" src="https://github.com/user-attachments/assets/9b472727-5a30-44fc-9bd8-05eaf0a24d25" />
*Note: The summary pages differ in scope. The image below shows the New Code summary (after adding the 2 new features):*
<img width="1729" height="724" alt="image" src="https://github.com/user-attachments/assets/7ed13abe-14bb-4e90-bfc4-c08f26ed763b" />

# Before Change
## Overall
<img width="1696" height="709" alt="image" src="https://github.com/user-attachments/assets/44126c71-6832-4de2-a026-71af0313d904" />
<img width="1696" height="663" alt="image" src="https://github.com/user-attachments/assets/caabdab8-ec27-4ee8-85df-b6d2f5ca4b06" />
<img width="1695" height="341" alt="image" src="https://github.com/user-attachments/assets/2ee4cb61-9b55-40ee-a74f-814b680fe5f8" />
<img width="1696" height="598" alt="image" src="https://github.com/user-attachments/assets/1aa3a351-120d-483e-88e7-4d2ab4d53044" />

## Issues
<img width="1697" height="478" alt="image" src="https://github.com/user-attachments/assets/536ab856-6f75-4593-8a0d-b748047f7537" />
<img width="1696" height="881" alt="image" src="https://github.com/user-attachments/assets/89bc834c-fd19-4362-9d94-d071edc33789" />

# After Change
## Overall
<img width="1728" height="826" alt="image" src="https://github.com/user-attachments/assets/452d7568-5e9e-4bc3-8903-d17ef0a0c7ff" />
<img width="1728" height="700" alt="image" src="https://github.com/user-attachments/assets/c11cf707-7c71-49f0-b63a-cd02026f4b24" />
<img width="1729" height="441" alt="image" src="https://github.com/user-attachments/assets/9b472727-5a30-44fc-9bd8-05eaf0a24d25" />
*Note: The summary pages differ in scope. The image below shows the New Code summary (after adding the 2 new features):*
<img width="1729" height="724" alt="image" src="https://github.com/user-attachments/assets/7ed13abe-14bb-4e90-bfc4-c08f26ed763b" />

*The image below shows the Overall Code summary:*
<img width="1727" height="782" alt="image" src="https://github.com/user-attachments/assets/d6a36ff3-ff69-4313-8dbc-1176b6c4666d" />

## Issues
<img width="1728" height="875" alt="image" src="https://github.com/user-attachments/assets/6d967c58-452a-465a-bb4a-02786738991c" />

## Comparison Summary

By resolving the critical findings (ReDoS vulnerabilities, Log Injection, Subresource Integrity warnings, and Code Duplication), the overall SonarCloud metrics have significantly improved. 

| Metric | Before Change | After Change | Trend |
|--------|---------------|--------------|-------------|
| **Test Coverage** | 0.0% | **91.3%** | 📈 Massive improvement |
| **Blocker Issues** | 2 | **0** | ✅ **All Blockers Resolved** |
| **High Severity Issues**| 6 | **4** | 📉 Reduced by 2 |
| **Security Issues** | 16 | **12** | 📉 Reduced by 4 |
| **Security Hotspots** | 16 | **15** | 📉 Reduced by 1 |
| **Reliability (Bugs)** | 135 | **125** | 📉 Reduced by 10 |
| **Maintainability** | 122 | **140** | 🔼 Increased (due to new features) |

### Key Takeaways
- **Blockers Eliminated:** The most dangerous issues (such as the ReDoS vulnerability and Log Injection) were completely eliminated, bringing Blocker issues down from 2 to 0.
- **Coverage Skyrocketed:** We successfully implemented robust testing, bringing the test coverage from a non-existent 0% all the way up to a healthy 91.3%.
- **General Health:** Security issues, Reliability issues, and High severity issues all saw a strong decrease. The slight increase in Maintainability issues (Code Smells) from 122 to 140 is a natural result of adding the two new features (which expanded the total lines of code), but the overall severity and security risk of the codebase have dropped drastically.
